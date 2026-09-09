import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class DepensesService {
  constructor(private readonly prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  async findAll(
    user: CurrentUserType,
    query: {
      search?: string;
      statut?: any;
      categorie?: any;
      dossierId?: string;
      annexeId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const annexeFilter = this.buildAnnexeFilter(user);

    const where: any = {
      ...annexeFilter,
      ...(query.annexeId ? { annexeId: query.annexeId } : {}),
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.categorie ? { categorie: query.categorie } : {}),
      ...(query.dossierId ? { dossierId: query.dossierId } : {}),
      ...(query.search
        ? {
            OR: [
              { numero: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { fournisseur: { nom: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.depense.count({ where }),
      this.prisma.depense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          annexe: { select: { id: true, nom: true, code: true } },
          fournisseur: { select: { id: true, nom: true, code: true } },
          dossier: { select: { id: true, numero: true } },
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user: CurrentUserType) {
    const depense = await this.prisma.depense.findUnique({
      where: { id },
      include: {
        annexe: true,
        fournisseur: true,
        dossier: true,
        creePar: { select: { id: true, nom: true, email: true } },
        approuvePar: { select: { id: true, nom: true, email: true } },
        transactions: { include: { caisse: true } },
      },
    });

    if (!depense) throw new NotFoundException(`Dépense ${id} non trouvée`);

    if (user.role !== 'ADMIN' && !user.annexeIds.includes(depense.annexeId)) {
      throw new ForbiddenException("Accès non autorisé à cette dépense");
    }

    return depense;
  }

  async create(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException("Vous ne pouvez pas créer de dépense pour cette annexe");
    }

    const existing = await this.prisma.depense.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro ${data.numero} existe déjà`);

    // Une dépense démarre toujours EN_ATTENTE : le client ne peut pas s'auto-approuver
    // ni marquer la dépense payée en contournant le workflow.
    const { statut: _st, approuveParId: _ap, creeParId: _cp, id: _id, ...depenseData } = data;

    return this.prisma.depense.create({
      data: {
        ...depenseData,
        montant: Number(depenseData.montant) || 0,
        statut: 'EN_ATTENTE',
        creeParId: user.id,
      },
      include: { annexe: true, fournisseur: true },
    });
  }

  async approuver(id: string, user: CurrentUserType) {
    const depense = await this.findOne(id, user);
    if (depense.statut !== 'EN_ATTENTE') {
      throw new BadRequestException("Seule une dépense en attente peut être approuvée");
    }

    return this.prisma.depense.update({
      where: { id },
      data: {
        statut: 'APPROUVEE',
        approuveParId: user.id,
      },
    });
  }

  async remove(id: string, user: CurrentUserType) {
    const depense = await this.findOne(id, user);
    if (depense.statut === 'PAYEE' || depense.transactions.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une dépense déjà payée. Elle est liée à un mouvement de caisse.',
      );
    }
    await this.prisma.depense.delete({ where: { id } });
    return { id };
  }

  async payerDepuisCaisse(
    id: string,
    user: CurrentUserType,
    data: { caisseId: string; motif?: string },
  ) {
    const depense = await this.findOne(id, user);

    if (depense.statut === 'PAYEE') {
      throw new BadRequestException('Cette dépense est déjà payée.');
    }
    if (depense.statut !== 'APPROUVEE') {
      throw new BadRequestException(
        'La dépense doit être approuvée avant paiement.',
      );
    }

    const caisse = await this.prisma.caisse.findUnique({ where: { id: data.caisseId } });
    if (!caisse) throw new NotFoundException("Caisse non trouvée");
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(caisse.annexeId)) {
      throw new ForbiddenException("Cette caisse n'appartient pas à votre annexe.");
    }
    if (caisse.statut === 'FERMEE') {
      throw new BadRequestException('Cette caisse est fermée aux opérations.');
    }
    if (!(depense.montant > 0)) {
      throw new BadRequestException('Le montant de la dépense est invalide.');
    }

    return this.prisma.$transaction(async (tx: any) => {
      // "Claim" du paiement : seule la 1re requête concurrente passe APPROUVEE
      // -> PAYEE ; les suivantes voient count === 0 et s'arrêtent (pas de
      // double décaissement).
      const claimed = await tx.depense.updateMany({
        where: { id, statut: 'APPROUVEE' },
        data: { statut: 'PAYEE' },
      });
      if (claimed.count === 0) {
        throw new BadRequestException('Cette dépense vient d’être payée par ailleurs.');
      }

      await tx.transactionCaisse.create({
        data: {
          caisseId: data.caisseId,
          type: 'SORTIE',
          montant: depense.montant,
          motif: data.motif || `Paiement dépense ${depense.numero}`,
          depenseId: depense.id,
          effectueParId: user.id,
        },
      });

      const updatedCaisse = await tx.caisse.update({
        where: { id: data.caisseId },
        data: { soldeActuel: { decrement: depense.montant } },
      });
      if (updatedCaisse.soldeActuel < 0) {
        throw new BadRequestException('Solde de caisse insuffisant');
      }

      return tx.depense.findUnique({ where: { id }, include: { annexe: true, fournisseur: true } });
    });
  }
}
