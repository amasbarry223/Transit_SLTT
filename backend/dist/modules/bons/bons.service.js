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
    isUserAdmin(user) {
        const role = String(user?.role || '').toUpperCase().trim();
        return role === 'ADMIN' || role === 'ADMINISTRATEUR' || role === 'DIRECTION' || (user?.permissions?.includes('*') ?? false);
    }
    buildAnnexeFilter(user) {
        if (this.isUserAdmin(user))
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
        if (params?.annexeId && !this.isUserAdmin(user) && !user.annexeIds.includes(params.annexeId)) {
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
        if (!this.isUserAdmin(user) && !user.annexeIds.includes(bon.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de sortie');
        }
        return bon;
    }
    async assertStockInAnnexe(stockId, annexeId) {
        if (!stockId)
            return;
        const stock = await this.prisma.stockItem.findUnique({ where: { id: stockId }, select: { annexeId: true } });
        if (!stock)
            throw new common_1.BadRequestException('Article de stock introuvable.');
        if (stock.annexeId !== annexeId) {
            throw new common_1.BadRequestException("L'article de stock n'appartient pas à l'annexe du bon.");
        }
    }
    async createBon(user, data) {
        if (!this.isUserAdmin(user) && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de bon pour cette annexe');
        }
        await this.assertStockInAnnexe(data.stockId, data.annexeId);
        const statut = data.statut && data.statut !== 'Validé' ? data.statut : 'En attente';
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
                statut,
            },
            include: { annexe: true, client: true, stock: true },
        });
    }
    async assertCanCorrectValidated(bonId, user, action) {
        if (!this.isUserAdmin(user)) {
            throw new common_1.ForbiddenException(`Seul un administrateur peut ${action} un bon de sortie validé.`);
        }
    }
    async moveStock(tx, user, m) {
        if (!m.stockId || m.delta === 0)
            return;
        const claimed = await tx.stockItem.updateMany({
            where: { id: m.stockId },
            data: { quantite: { increment: m.delta } },
        });
        if (claimed.count === 0)
            return;
        const fresh = await tx.stockItem.findUnique({ where: { id: m.stockId } });
        if (fresh && fresh.quantite < 0) {
            throw new common_1.BadRequestException('Quantité insuffisante en stock pour cette correction du bon de sortie.');
        }
        await tx.mouvementStock.create({
            data: {
                stockId: m.stockId,
                annexeId: m.annexeId,
                date: new Date().toISOString().slice(0, 10),
                type: m.delta > 0 ? 'Entrée' : 'Sortie',
                marchandise: m.marchandise,
                quantite: Math.abs(m.delta),
                unite: m.unite,
                responsable: user.nom,
                bonRef: m.bonRef,
                motif: m.motif,
            },
        });
    }
    async updateBon(id, user, data) {
        const bon = await this.findOneBon(id, user);
        if (!this.isUserAdmin(user) && data.annexeId && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        await this.assertStockInAnnexe(data.stockId !== undefined ? data.stockId : bon.stockId, data.annexeId !== undefined ? data.annexeId : bon.annexeId);
        const next = {
            date: data.date !== undefined ? data.date : bon.date,
            clientId: data.clientId !== undefined ? data.clientId : bon.clientId,
            clientNom: data.clientNom !== undefined ? data.clientNom : bon.clientNom,
            annexeId: data.annexeId !== undefined ? data.annexeId : bon.annexeId,
            stockId: data.stockId !== undefined ? data.stockId || null : bon.stockId,
            marchandise: data.marchandise !== undefined ? data.marchandise : bon.marchandise,
            quantite: data.quantite !== undefined ? this.toPositiveQuantite(data.quantite) : bon.quantite,
            unite: data.unite !== undefined ? data.unite : bon.unite,
            motif: data.motif !== undefined ? data.motif : bon.motif,
            montant: data.montant !== undefined ? this.toNonNegativeMontant(data.montant) : bon.montant,
        };
        if (bon.statut !== 'Validé') {
            const updated = await this.prisma.bonSortie.updateMany({
                where: { id: bon.id, statut: { not: 'Validé' } },
                data: next,
            });
            if (updated.count === 0) {
                throw new common_1.BadRequestException('Ce bon vient d\'être validé : rechargez la page avant de le modifier.');
            }
            return this.prisma.bonSortie.findUnique({
                where: { id: bon.id },
                include: { annexe: true, client: true, stock: true },
            });
        }
        await this.assertCanCorrectValidated(bon.id, user, 'modifier');
        const stockChange = next.stockId !== bon.stockId || next.quantite !== bon.quantite;
        return this.prisma.$transaction(async (tx) => {
            if (stockChange) {
                await this.moveStock(tx, user, {
                    stockId: bon.stockId,
                    annexeId: bon.annexeId,
                    delta: bon.quantite,
                    marchandise: bon.marchandise,
                    unite: bon.unite,
                    bonRef: bon.reference,
                    motif: `Annulation (modification) du bon ${bon.reference}`,
                });
                await this.moveStock(tx, user, {
                    stockId: next.stockId,
                    annexeId: next.annexeId,
                    delta: -next.quantite,
                    marchandise: next.marchandise,
                    unite: next.unite,
                    bonRef: bon.reference,
                    motif: `Sortie corrigée du bon ${bon.reference}`,
                });
            }
            await tx.bonLivraison.updateMany({
                where: { bonSortieId: bon.id },
                data: {
                    clientId: next.clientId,
                    clientNom: next.clientNom,
                    annexeId: next.annexeId,
                },
            });
            const updated = await tx.bonSortie.updateMany({ where: { id: bon.id, statut: 'Validé' }, data: next });
            if (updated.count === 0)
                throw new common_1.BadRequestException('Ce bon a changé entre-temps : rechargez la page.');
            return tx.bonSortie.findUnique({ where: { id: bon.id }, include: { annexe: true, client: true, stock: true } });
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
        if (!this.isUserAdmin(user) && !user.annexeIds.includes(bon.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de sortie');
        }
        if (bon.statut !== 'Validé') {
            await this.prisma.$transaction(async (tx) => {
                await tx.bonLivraison.deleteMany({ where: { bonSortieId: bon.id } });
                await tx.bonSortie.deleteMany({ where: { id: bon.id, statut: { not: 'Validé' } } });
            });
            return { id: bon.id };
        }
        await this.assertCanCorrectValidated(bon.id, user, 'supprimer');
        const validated = bon;
        await this.prisma.$transaction(async (tx) => {
            await tx.bonLivraison.deleteMany({ where: { bonSortieId: validated.id } });
            await this.moveStock(tx, user, {
                stockId: validated.stockId,
                annexeId: validated.annexeId,
                delta: validated.quantite,
                marchandise: validated.marchandise,
                unite: validated.unite,
                bonRef: validated.reference,
                motif: `Annulation (suppression) du bon ${validated.reference}`,
            });
            const deleted = await tx.bonSortie.deleteMany({ where: { id: validated.id, statut: 'Validé' } });
            if (deleted.count === 0)
                throw new common_1.BadRequestException('Ce bon a changé entre-temps : rechargez la page.');
        });
        return { id: bon.id };
    }
    async findAllBonsCaisse(user, params) {
        if (params?.annexeId && !this.isUserAdmin(user) && !user.annexeIds.includes(params.annexeId)) {
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
        if (!this.isUserAdmin(user) && !user.annexeIds.includes(bon.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de caisse');
        }
        return bon;
    }
    async createBonCaisse(user, data) {
        if (!this.isUserAdmin(user) && !user.annexeIds.includes(data.annexeId)) {
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
            if (annexeId && !this.isUserAdmin(user) && !user.annexeIds.includes(annexeId)) {
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
        if (!this.isUserAdmin(user) && !user.annexeIds.includes(existing.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de caisse');
        }
        if (data.annexeId && !this.isUserAdmin(user) && !user.annexeIds.includes(data.annexeId)) {
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
        if (!this.isUserAdmin(user) && !user.annexeIds.includes(existing.annexeId)) {
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