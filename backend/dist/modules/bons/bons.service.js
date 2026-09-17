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
exports.BonsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BonsService = class BonsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { annexeId: { in: user.annexeIds } };
    }
    toPositiveMontant(value) {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) {
            throw new common_1.BadRequestException('Le montant de chaque ligne doit être un nombre supérieur à 0.');
        }
        return n;
    }
    toPositiveQuantite(value) {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) {
            throw new common_1.BadRequestException('La quantité du bon doit être un nombre supérieur à 0.');
        }
        return n;
    }
    toNonNegativeMontant(value) {
        const n = Number(value || 0);
        if (!Number.isFinite(n) || n < 0) {
            throw new common_1.BadRequestException('Le montant du bon ne peut pas être négatif.');
        }
        return n;
    }
    async findAllBons(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
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
    async findOneBon(id, user) {
        let bon = await this.prisma.bonSortie.findUnique({
            where: { id },
            include: { annexe: true, client: true, stock: true },
        });
        if (!bon) {
            bon = await this.prisma.bonSortie.findFirst({
                where: { reference: id },
                include: { annexe: true, client: true, stock: true },
            });
        }
        if (!bon)
            throw new common_1.NotFoundException(`Bon de sortie ${id} non trouvé`);
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de sortie');
        }
        return bon;
    }
    async createBon(user, data) {
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de bon pour cette annexe');
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
                quantite: this.toPositiveQuantite(data.quantite),
                unite: data.unite || 'colis',
                motif: data.motif || '',
                montant: this.toNonNegativeMontant(data.montant),
                statut: data.statut || 'En attente',
            },
            include: { annexe: true, client: true, stock: true },
        });
    }
    async validateBon(id, user) {
        const bon = await this.findOneBon(id, user);
        if (bon.statut === 'Validé')
            return bon;
        return this.prisma.$transaction(async (tx) => {
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
                const claimed = await tx.stockItem.updateMany({
                    where: { id: bon.stockId },
                    data: { quantite: { decrement: bon.quantite } },
                });
                if (claimed.count > 0) {
                    const fresh = await tx.stockItem.findUnique({ where: { id: bon.stockId } });
                    if (fresh && fresh.quantite < 0) {
                        throw new common_1.BadRequestException('Quantité insuffisante en stock pour valider ce bon de sortie.');
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
    async deleteBon(id, user) {
        let bon = await this.prisma.bonSortie.findUnique({ where: { id } });
        if (!bon) {
            bon = await this.prisma.bonSortie.findFirst({ where: { reference: id } });
        }
        if (!bon)
            return { id };
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de sortie');
        }
        if (bon.statut === 'Validé') {
            throw new common_1.BadRequestException("Un bon de sortie validé ne peut pas être supprimé (le stock a déjà été mouvementé).");
        }
        await this.prisma.bonSortie.delete({ where: { id: bon.id } });
        return { id: bon.id };
    }
    async findAllBonsCaisse(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
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
    async findOneBonCaisse(id, user) {
        let bon = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
        if (!bon) {
            bon = await this.prisma.bonSortieCaisse.findFirst({ where: { reference: id } });
        }
        if (!bon)
            throw new common_1.NotFoundException(`Bon de caisse ${id} non trouvé`);
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de caisse');
        }
        return bon;
    }
    async createBonCaisse(user, data) {
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de bon de caisse pour cette annexe');
        }
        const date = data.date || new Date().toISOString().slice(0, 10);
        const lignes = (data.lignes || []).map((l) => ({
            date: l.date || date,
            beneficiaire: l.beneficiaire,
            motif: l.motif,
            montant: this.toPositiveMontant(l.montant),
        }));
        const montantTotal = lignes.reduce((s, l) => s + l.montant, 0);
        return this.prisma.bonSortieCaisse.create({
            data: {
                reference: data.reference,
                date,
                annexeId: data.annexeId,
                montantTotal,
                creePar: user.nom,
                lignes: { create: lignes },
            },
            include: { annexe: true, lignes: true },
        });
    }
    async updateBonCaisse(id, user, data) {
        let existing = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
        if (!existing && data.reference) {
            existing = await this.prisma.bonSortieCaisse.findUnique({ where: { reference: data.reference } });
        }
        if (!existing) {
            existing = await this.prisma.bonSortieCaisse.findFirst({ where: { reference: id } });
        }
        if (!existing) {
            const annexeId = data.annexeId || user.annexeIds[0];
            if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
                throw new common_1.ForbiddenException('Vous ne pouvez pas rattacher ce bon de caisse à cette annexe');
            }
            const date = data.date || new Date().toISOString().slice(0, 10);
            const lignes = (data.lignes || []).map((l) => ({
                date: l.date || date,
                beneficiaire: l.beneficiaire,
                motif: l.motif,
                montant: this.toPositiveMontant(l.montant),
            }));
            const montantTotal = lignes.reduce((s, l) => s + l.montant, 0);
            return this.prisma.bonSortieCaisse.create({
                data: {
                    id,
                    reference: data.reference || `N°${Date.now()}`,
                    date,
                    annexeId,
                    montantTotal,
                    creePar: user.nom,
                    lignes: { create: lignes },
                },
                include: { annexe: true, lignes: true },
            });
        }
        const targetId = existing.id;
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de caisse');
        }
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas rattacher ce bon de caisse à cette annexe');
        }
        const date = data.date || existing.date;
        const annexeId = data.annexeId || existing.annexeId;
        const hasLignes = Array.isArray(data.lignes);
        const lignes = hasLignes
            ? data.lignes.map((l) => ({
                date: l.date || date,
                beneficiaire: l.beneficiaire,
                motif: l.motif,
                montant: this.toPositiveMontant(l.montant),
            }))
            : null;
        const montantTotal = lignes ? lignes.reduce((s, l) => s + l.montant, 0) : undefined;
        return this.prisma.$transaction(async (tx) => {
            if (hasLignes) {
                await tx.ligneBonSortieCaisse.deleteMany({ where: { bonSortieCaisseId: targetId } });
            }
            return tx.bonSortieCaisse.update({
                where: { id: targetId },
                data: {
                    date,
                    annexeId,
                    ...(lignes ? { montantTotal, lignes: { create: lignes } } : {}),
                },
                include: { annexe: true, lignes: true },
            });
        });
    }
    async deleteBonCaisse(id, user) {
        let existing = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
        if (!existing) {
            existing = await this.prisma.bonSortieCaisse.findFirst({ where: { reference: id } });
        }
        if (!existing) {
            return { id };
        }
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de caisse');
        }
        await this.prisma.bonSortieCaisse.delete({ where: { id: existing.id } });
        return { id: existing.id };
    }
};
exports.BonsService = BonsService;
exports.BonsService = BonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BonsService);
//# sourceMappingURL=bons.service.js.map