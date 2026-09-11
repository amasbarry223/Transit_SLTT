import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class BonsService {
  constructor(private prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  // Bons de sortie stock
  async findAllBons(user: CurrentUserType, params?: { annexeId?: string; clientId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      ...this.buildAnnexeFilter(user),
      ...(params?.annexeId ? { annexeId: params.annexeId } : {}),
      ...(params?.clientId ? { clientId: params.clientId } : {}),
    };

    return this.prisma.bonSortie.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        client: { select: { id: true, nom: true } },
        stock: { select: { id: true, marchandise: true, quantite: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneBon(id: string, user: CurrentUserType) {
    const bon = await this.prisma.bonSortie.findUnique({
      where: { id },
      include: { annexe: true, client: true, stock: true },
    });
    if (!bon) throw new NotFoundException(`Bon de sortie ${id} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de sortie');
    }
    return bon;
  }

  async createBon(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de bon pour cette annexe');
    }
    return this.prisma.bonSortie.create({
      data: {
        reference: data.reference,
        date: data.date || new Date().toISOString().slice(0, 10),
        clientId: data.clientId,
        clientNom: data.clientNom || null,
        annexeId: data.annexeId,
        stockId: data.stockId || null,
        marchandise: data.marchandise,
        quantite: Number(data.quantite || 0),
        unite: data.unite || 'colis',
        motif: data.motif || '',
        montant: Number(data.montant || 0),
        statut: data.statut || 'En attente',
      },
      include: { annexe: true, client: true, stock: true },
    });
  }

  async validateBon(id: string, user: CurrentUserType) {
    const bon = await this.findOneBon(id, user);
    if (bon.statut === 'Validé') return bon;

    return this.prisma.$transaction(async (tx: any) => {
      // Passage à "Validé" conditionné au statut courant : deux validations
      // simultanées ne peuvent pas déduire le stock deux fois.
      const claimed = await tx.bonSortie.updateMany({
        where: { id, statut: { not: 'Validé' } },
        data: { statut: 'Validé' },
      });
      if (claimed.count === 0) {
        return tx.bonSortie.findUnique({
          where: { id },
          include: { annexe: true, client: true, stock: true },
        });
      }

      if (bon.stockId) {
        // Décrément atomique (même pattern que stock.service.ts) : évite
        // qu'une validation concurrente d'un autre mouvement sur le même
        // article n'écrase le résultat de l'autre (perte de mise à jour).
        const claimed = await tx.stockItem.updateMany({
          where: { id: bon.stockId },
          data: { quantite: { decrement: bon.quantite } },
        });
        if (claimed.count > 0) {
          const fresh = await tx.stockItem.findUnique({ where: { id: bon.stockId } });
          if (fresh && fresh.quantite < 0) {
            await tx.stockItem.update({ where: { id: bon.stockId }, data: { quantite: 0 } });
          }
          await tx.mouvementStock.create({
            data: {
              stockId: bon.stockId,
              annexeId: bon.annexeId,
              date: new Date().toISOString().slice(0, 10),
              type: 'Sortie',
              marchandise: bon.marchandise,
              quantite: bon.quantite,
              unite: bon.unite,
              responsable: 'Magasinier',
              bonRef: bon.reference,
              motif: bon.motif,
            },
          });
        }
      }

      return tx.bonSortie.findUnique({
        where: { id },
        include: { annexe: true, client: true, stock: true },
      });
    });
  }

  async deleteBon(id: string, user: CurrentUserType) {
    const bon = await this.findOneBon(id, user);
    if (bon.statut === 'Validé') {
      throw new BadRequestException(
        "Un bon de sortie validé ne peut pas être supprimé (le stock a déjà été mouvementé).",
      );
    }
    await this.prisma.bonSortie.delete({ where: { id } });
    return { id };
  }

  // Bons de sortie caisse
  async findAllBonsCaisse(user: CurrentUserType, params?: { annexeId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      ...this.buildAnnexeFilter(user),
      ...(params?.annexeId ? { annexeId: params.annexeId } : {}),
    };

    return this.prisma.bonSortieCaisse.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        lignes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneBonCaisse(id: string, user: CurrentUserType) {
    const bon = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
    if (!bon) throw new NotFoundException(`Bon de caisse ${id} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de caisse');
    }
    return bon;
  }

  async createBonCaisse(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de bon de caisse pour cette annexe');
    }
    const date = data.date || new Date().toISOString().slice(0, 10);
    const lignes = (data.lignes || []).map((l: any) => ({
      date: l.date || date,
      beneficiaire: l.beneficiaire,
      motif: l.motif,
      montant: Number(l.montant) || 0,
    }));
    // Le total est la somme des lignes, jamais une valeur fournie par le client
    // (sinon en-tête et détail peuvent diverger).
    const montantTotal = lignes.reduce((s: number, l: any) => s + l.montant, 0);

    return this.prisma.bonSortieCaisse.create({
      data: {
        reference: data.reference,
        date,
        annexeId: data.annexeId,
        montantTotal,
        // Attribution fiable : nom de l'auteur pris du JWT, jamais d'un
        // champ texte libre fourni par le client.
        creePar: user.nom,
        lignes: { create: lignes },
      },
      include: { annexe: true, lignes: true },
    });
  }

  async deleteBonCaisse(id: string, user: CurrentUserType) {
    await this.findOneBonCaisse(id, user);
    await this.prisma.bonSortieCaisse.delete({ where: { id } });
    return { id };
  }
}
