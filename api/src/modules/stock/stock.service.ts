import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAllItems(params?: { search?: string; annexeId?: string; clientId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;
    if (params?.clientId) where.clientId = params.clientId;
    if (params?.search) {
      where.OR = [
        { marchandise: { contains: params.search } },
        { depositaire: { contains: params.search } },
        { client: { nom: { contains: params.search } } },
      ];
    }
    return this.prisma.stockItem.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        client: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: { annexe: true, client: true, mouvements: true },
    });
    if (!item) throw new NotFoundException(`Article de stock ${id} non trouvé`);
    return item;
  }

  async createItem(data: any) {
    return this.prisma.stockItem.create({
      data: {
        clientId: data.clientId || null,
        annexeId: data.annexeId,
        marchandise: data.marchandise,
        quantite: Number(data.quantite || 0),
        unite: data.unite || 'kg',
        seuil: Number(data.seuil || 0),
        depositaire: data.depositaire || null,
        commercial: data.commercial || null,
        sommePayee: Number(data.sommePayee || 0),
        resteAPayer: Number(data.resteAPayer || 0),
        date: data.date || new Date().toISOString().slice(0, 10),
      },
      include: { annexe: true, client: true },
    });
  }

  async updateItem(id: string, data: any) {
    await this.findOneItem(id);
    const updateData: any = { ...data };
    if (data.quantite !== undefined) updateData.quantite = Number(data.quantite);
    if (data.seuil !== undefined) updateData.seuil = Number(data.seuil);
    if (data.sommePayee !== undefined) updateData.sommePayee = Number(data.sommePayee);
    if (data.resteAPayer !== undefined) updateData.resteAPayer = Number(data.resteAPayer);

    return this.prisma.stockItem.update({
      where: { id },
      data: updateData,
      include: { annexe: true, client: true },
    });
  }

  async deleteItem(id: string) {
    await this.findOneItem(id);
    return this.prisma.stockItem.delete({ where: { id } });
  }

  // Mouvements
  async findAllMouvements(params?: { annexeId?: string; stockId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;
    if (params?.stockId) where.stockId = params.stockId;

    return this.prisma.mouvementStock.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        stock: { select: { id: true, marchandise: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMouvement(data: any) {
    const mouvement = await this.prisma.mouvementStock.create({
      data: {
        stockId: data.stockId || null,
        annexeId: data.annexeId,
        date: data.date || new Date().toISOString().slice(0, 10),
        type: data.type,
        marchandise: data.marchandise || null,
        quantite: Number(data.quantite || 0),
        unite: data.unite || null,
        responsable: data.responsable || null,
        bonRef: data.bonRef || null,
        motif: data.motif || null,
      },
      include: { annexe: true, stock: true },
    });

    // Mettre à jour la quantité du stock si lié à un stockId
    if (data.stockId) {
      const stock = await this.prisma.stockItem.findUnique({ where: { id: data.stockId } });
      if (stock) {
        const delta = data.type === 'Entrée' ? Number(data.quantite) : -Number(data.quantite);
        await this.prisma.stockItem.update({
          where: { id: data.stockId },
          data: { quantite: Math.max(0, stock.quantite + delta) },
        });
      }
    }

    return mouvement;
  }
}
