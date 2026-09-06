import { Injectable, NotFoundException } from '@nestjs/common';
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

    // Déduire du stock si lié
    if (bon.stockId) {
      const stock = await this.prisma.stockItem.findUnique({ where: { id: bon.stockId } });
      if (stock) {
        await this.prisma.stockItem.update({
          where: { id: bon.stockId },
          data: { quantite: Math.max(0, stock.quantite - bon.quantite) },
        });

        // Enregistrer le mouvement de sortie
        await this.prisma.mouvementStock.create({
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

    return this.prisma.bonSortie.update({
      where: { id },
      data: { statut: 'Validé' },
      include: { annexe: true, client: true, stock: true },
    });
  }

  async deleteBon(id: string) {
    await this.findOneBon(id);
    return this.prisma.bonSortie.delete({ where: { id } });
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
    return this.prisma.bonSortieCaisse.create({
      data: {
        reference: data.reference,
        date,
        annexeId: data.annexeId,
        montantTotal: Number(data.montantTotal || 0),
        creePar: data.creePar || null,
        lignes: {
          create: (data.lignes || []).map((l: any) => ({
            date: l.date || date,
            beneficiaire: l.beneficiaire,
            motif: l.motif,
            montant: Number(l.montant || 0),
          })),
        },
      },
      include: { annexe: true, lignes: true },
    });
  }

  async deleteBonCaisse(id: string) {
    return this.prisma.bonSortieCaisse.delete({ where: { id } });
  }
}
