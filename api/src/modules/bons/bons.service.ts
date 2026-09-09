import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BonsService {
  constructor(private prisma: PrismaService) {}

  // Bons de sortie stock
  async findAllBons(params?: { annexeId?: string; clientId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;
    if (params?.clientId) where.clientId = params.clientId;

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

  async findOneBon(id: string) {
    const bon = await this.prisma.bonSortie.findUnique({
      where: { id },
      include: { annexe: true, client: true, stock: true },
    });
    if (!bon) throw new NotFoundException(`Bon de sortie ${id} non trouvé`);
    return bon;
  }

  async createBon(data: any) {
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

  async validateBon(id: string) {
    const bon = await this.findOneBon(id);
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
        const stock = await tx.stockItem.findUnique({ where: { id: bon.stockId } });
        if (stock) {
          await tx.stockItem.update({
            where: { id: bon.stockId },
            data: { quantite: Math.max(0, stock.quantite - bon.quantite) },
          });
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

  async deleteBon(id: string) {
    const bon = await this.findOneBon(id);
    if (bon.statut === 'Validé') {
      throw new BadRequestException(
        "Un bon de sortie validé ne peut pas être supprimé (le stock a déjà été mouvementé).",
      );
    }
    await this.prisma.bonSortie.delete({ where: { id } });
    return { id };
  }

  // Bons de sortie caisse
  async findAllBonsCaisse(params?: { annexeId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;

    return this.prisma.bonSortieCaisse.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        lignes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBonCaisse(data: any) {
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
        creePar: data.creePar || null,
        lignes: { create: lignes },
      },
      include: { annexe: true, lignes: true },
    });
  }

  async deleteBonCaisse(id: string) {
    const existing = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Bon de caisse ${id} non trouvé`);
    await this.prisma.bonSortieCaisse.delete({ where: { id } });
    return { id };
  }
}
