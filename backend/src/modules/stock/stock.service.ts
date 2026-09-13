import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  async findAllItems(user: CurrentUserType, params?: { search?: string; annexeId?: string; clientId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      AND: [
        this.buildAnnexeFilter(user),
        params?.annexeId ? { annexeId: params.annexeId } : {},
        params?.clientId ? { clientId: params.clientId } : {},
        params?.search
          ? {
              OR: [
                { marchandise: { contains: params.search } },
                { depositaire: { contains: params.search } },
                { client: { nom: { contains: params.search } } },
              ],
            }
          : {},
      ],
    };
    return this.prisma.stockItem.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        client: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneItem(id: string, user: CurrentUserType) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: { annexe: true, client: true, mouvements: true },
    });
    if (!item) throw new NotFoundException(`Article de stock ${id} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(item.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cet article de stock');
    }
    return item;
  }

  async createItem(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException("Vous ne pouvez pas créer d'article pour cette annexe");
    }
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

  async updateItem(id: string, user: CurrentUserType, data: any) {
    await this.findOneItem(id, user);
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher cet article à cette annexe');
    }
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

  async deleteItem(id: string, user: CurrentUserType) {
    await this.findOneItem(id, user);
    return this.prisma.stockItem.delete({ where: { id } });
  }

  // Mouvements
  async findAllMouvements(user: CurrentUserType, params?: { annexeId?: string; stockId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      AND: [
        this.buildAnnexeFilter(user),
        params?.annexeId ? { annexeId: params.annexeId } : {},
        params?.stockId ? { stockId: params.stockId } : {},
      ],
    };

    return this.prisma.mouvementStock.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        stock: { select: { id: true, marchandise: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMouvement(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de mouvement pour cette annexe');
    }
    const quantite = Number(data.quantite);
    if (!Number.isFinite(quantite) || quantite <= 0) {
      throw new BadRequestException('La quantité du mouvement doit être supérieure à 0');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const mouvement = await tx.mouvementStock.create({
        data: {
          stockId: data.stockId || null,
          annexeId: data.annexeId,
          date: data.date || new Date().toISOString().slice(0, 10),
          type: data.type,
          marchandise: data.marchandise || null,
          quantite,
          unite: data.unite || null,
          responsable: data.responsable || null,
          bonRef: data.bonRef || null,
          motif: data.motif || null,
        },
        include: { annexe: true, stock: true },
      });

      // Ajuste le stock lié de façon atomique (increment Prisma, pas
      // lecture-puis-écriture) : deux mouvements concurrents sur le même
      // article n'écrasent plus le résultat l'un de l'autre (perte de mise
      // à jour). updateMany ne lève pas si stockId ne correspond à rien
      // (comportement identique à l'ancien `if (stock)`).
      if (data.stockId) {
        const delta = data.type === 'Entrée' ? quantite : -quantite;
        const claimed = await tx.stockItem.updateMany({
          where: { id: data.stockId },
          data: { quantite: { increment: delta } },
        });
        if (claimed.count > 0) {
          const fresh = await tx.stockItem.findUnique({ where: { id: data.stockId } });
          if (fresh && fresh.quantite < 0) {
            await tx.stockItem.update({ where: { id: data.stockId }, data: { quantite: 0 } });
          }
        }
      }

      return mouvement;
    });
  }
}
