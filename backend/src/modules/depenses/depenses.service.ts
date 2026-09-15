import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
import { buildAnnexeScopeFilter, assertAnnexeAccess } from '../../common/annexe-filter.utils';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination.utils';

@Injectable()
export class DepensesService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { page, limit, skip } = parsePagination(query, 20);

    assertAnnexeAccess(user, query.annexeId, 'cette annexe');

    const where: any = {
      ...buildAnnexeScopeFilter(user),
      ...(query.annexeId ? { annexeId: query.annexeId } : {}),
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.categorie ? { categorie: query.categorie } : {}),
      ...(query.dossierId ? { dossierId: query.dossierId } : {}),
      ...(query.search
        ? {
            OR: [
              { numero: { contains: query.search } },
              { description: { contains: query.search } },
              { fournisseur: { nom: { contains: query.search } } },
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

    return buildPaginatedResponse(data, total, { page, limit });
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

    assertAnnexeAccess(user, depense.annexeId, 'cette dépense');

    return depense;
  }

  async create(user: CurrentUserType, data: any) {
    assertAnnexeAccess(user, data.annexeId, 'cette annexe');

    const existing = await this.prisma.depense.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro ${data.numero} existe déjà`);

    // `Number(x) || 0` acceptait un montant nul ou négatif sans le rejeter —
    // une dépense enregistre un coût réellement engagé, jamais 0 ni négatif.
    const montant = Number(data.montant);
    if (!Number.isFinite(montant) || montant <= 0) {
      throw new BadRequestException('Le montant de la dépense doit être un nombre supérieur à 0.');
    }

    // Le fournisseur utilise un soft-delete (`actif: false`) : sans ce
    // contrôle, on pouvait continuer à créer des dépenses sur un fournisseur
    // désactivé, contournant le filtre `actif: true` appliqué par
    // fournisseurs.findAll().
    if (data.fournisseurId) {
      const fournisseur = await this.prisma.fournisseur.findUnique({ where: { id: data.fournisseurId } });
      if (!fournisseur || !fournisseur.actif) {
        throw new BadRequestException('Fournisseur invalide ou désactivé.');
      }
    }

    // Une dépense démarre toujours EN_ATTENTE : le client ne peut pas s'auto-approuver
    // ni marquer la dépense payée en contournant le workflow.
    const { statut: _st, approuveParId: _ap, creeParId: _cp, id: _id, ...depenseData } = data;

    return this.prisma.depense.create({
      data: {
        ...depenseData,
        montant,
        statut: 'EN_ATTENTE',
        creeParId: user.id,
      },
      include: { annexe: true, fournisseur: true },
    });
  }

  async approuver(id: string, user: CurrentUserType) {
    const depense = await this.findOne(id, user);
    if (depense.statut !== 'EN_ATTENTE') {
      throw new BadRequestException('Seule une dépense en attente peut être approuvée');
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
      throw new BadRequestException('La dépense doit être approuvée avant paiement.');
    }

    const caisse = await this.prisma.caisse.findUnique({ where: { id: data.caisseId } });
    if (!caisse) throw new NotFoundException('Caisse non trouvée');

    assertAnnexeAccess(user, caisse.annexeId, "cette caisse");

    if (caisse.statut === 'FERMEE') {
      throw new BadRequestException('Cette caisse est fermée aux opérations.');
    }
    if (!(depense.montant > 0)) {
      throw new BadRequestException('Le montant de la dépense est invalide.');
    }

    return this.prisma.$transaction(async (tx: any) => {
      // "Claim" du paiement atomique pour éviter les doubles décaissements
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
