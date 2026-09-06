import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class FacturesService {
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
      clientId?: string;
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
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.dossierId ? { dossierId: query.dossierId } : {}),
      ...(query.search
        ? {
            OR: [
              { numero: { contains: query.search, mode: 'insensitive' } },
              { client: { nom: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.facture.count({ where }),
      this.prisma.facture.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, nom: true, code: true } },
          annexe: { select: { id: true, nom: true, code: true } },
          dossier: { select: { id: true, numero: true } },
          lignes: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: CurrentUserType) {
    const facture = await this.prisma.facture.findUnique({
      where: { id },
      include: {
        client: true,
        annexe: true,
        dossier: true,
        lignes: true,
        transactions: { include: { caisse: true } },
        creePar: { select: { id: true, nom: true, email: true } },
      },
    });

    if (!facture) throw new NotFoundException(`Facture ${id} non trouvée`);

    if (user.role !== 'ADMIN' && !user.annexeIds.includes(facture.annexeId)) {
      throw new ForbiddenException("Accès non autorisé à cette facture");
    }

    return facture;
  }

  async create(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException("Vous ne pouvez pas émettre de facture pour cette annexe");
    }

    const existing = await this.prisma.facture.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro de facture ${data.numero} existe déjà`);

    const { lignes, ...factureData } = data;

    // Calcul automatique des totaux si lignes fournies
    let montantHt = 0;
    const lignesFormatted = (lignes || []).map((l: any) => {
      const total = (Number(l.quantite) || 1) * (Number(l.prixUnitaire) || 0);
      montantHt += total;
      return {
        designation: l.designation,
        quantite: Number(l.quantite) || 1,
        prixUnitaire: Number(l.prixUnitaire) || 0,
        montantTotal: total,
      };
    });

    const tauxTva = factureData.tauxTva !== undefined ? Number(factureData.tauxTva) : 18;
    const montantTva = (montantHt * tauxTva) / 100;
    const montantTtc = montantHt + montantTva;

    return this.prisma.facture.create({
      data: {
        ...factureData,
        creeParId: user.id,
        montantHt,
        tauxTva,
        montantTva,
        montantTtc,
        lignes: {
          create: lignesFormatted,
        },
      },
      include: { lignes: true, client: true },
    });
  }

  async enregistrerPaiement(id: string, user: CurrentUserType, data: { montant: number; caisseId: string; motif?: string }) {
    const facture = await this.findOne(id, user);

    return this.prisma.$transaction(async (tx: any) => {
      const nouveauMontantPaye = facture.montantPaye + data.montant;
      const statut = nouveauMontantPaye >= facture.montantTtc ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';

      const updatedFacture = await tx.facture.update({
        where: { id },
        data: {
          montantPaye: nouveauMontantPaye,
          statut,
        },
      });

      // Créer la transaction de caisse
      await tx.transactionCaisse.create({
        data: {
          caisseId: data.caisseId,
          type: 'ENTREE',
          montant: data.montant,
          motif: data.motif || `Paiement facture ${facture.numero}`,
          factureId: facture.id,
          effectueParId: user.id,
        },
      });

      // Mettre à jour le solde de la caisse
      await tx.caisse.update({
        where: { id: data.caisseId },
        data: { soldeActuel: { increment: data.montant } },
      });

      return updatedFacture;
    });
  }
}
