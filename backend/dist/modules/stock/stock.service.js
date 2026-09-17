"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let StockService = class StockService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { annexeId: { in: user.annexeIds } };
    }
    async findAllItems(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
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
    async findOneItem(id, user) {
        const item = await this.prisma.stockItem.findUnique({
            where: { id },
            include: { annexe: true, client: true, mouvements: true },
        });
        if (!item)
            throw new common_1.NotFoundException(`Article de stock ${id} non trouvé`);
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(item.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cet article de stock');
        }
        return item;
    }
    toNonNegativeQuantite(value) {
        const n = Number(value || 0);
        if (!Number.isFinite(n) || n < 0) {
            throw new common_1.BadRequestException('La quantité en stock ne peut pas être négative.');
        }
        return n;
    }
    async createItem(user, data) {
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException("Vous ne pouvez pas créer d'article pour cette annexe");
        }
        return this.prisma.stockItem.create({
            data: {
                clientId: data.clientId || null,
                annexeId: data.annexeId,
                marchandise: data.marchandise,
                quantite: this.toNonNegativeQuantite(data.quantite),
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
    async updateItem(id, user, data) {
        await this.findOneItem(id, user);
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas rattacher cet article à cette annexe');
        }
        const updateData = { ...data };
        if (data.quantite !== undefined)
            updateData.quantite = this.toNonNegativeQuantite(data.quantite);
        if (data.seuil !== undefined)
            updateData.seuil = Number(data.seuil);
        if (data.sommePayee !== undefined)
            updateData.sommePayee = Number(data.sommePayee);
        if (data.resteAPayer !== undefined)
            updateData.resteAPayer = Number(data.resteAPayer);
        return this.prisma.stockItem.update({
            where: { id },
            data: updateData,
            include: { annexe: true, client: true },
        });
    }
    async deleteItem(id, user) {
        await this.findOneItem(id, user);
        return this.prisma.$transaction(async (tx) => {
            await tx.bonSortie.updateMany({
                where: { stockId: id },
                data: { stockId: null },
            });
            return tx.stockItem.delete({ where: { id } });
        });
    }
    async findAllMouvements(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
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
    async createMouvement(user, data) {
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de mouvement pour cette annexe');
        }
        const quantite = Number(data.quantite);
        if (!Number.isFinite(quantite) || quantite <= 0) {
            throw new common_1.BadRequestException('La quantité du mouvement doit être supérieure à 0');
        }
        return this.prisma.$transaction(async (tx) => {
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
            if (data.stockId) {
                const delta = data.type === 'Entrée' ? quantite : -quantite;
                const claimed = await tx.stockItem.updateMany({
                    where: { id: data.stockId },
                    data: { quantite: { increment: delta } },
                });
                if (claimed.count > 0) {
                    const fresh = await tx.stockItem.findUnique({ where: { id: data.stockId } });
                    if (fresh && fresh.quantite < 0) {
                        throw new common_1.BadRequestException('Quantité insuffisante en stock pour cette sortie.');
                    }
                }
            }
            return mouvement;
        });
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockService);
//# sourceMappingURL=stock.service.js.map