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
exports.ComptabiliteService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let ComptabiliteService = class ComptabiliteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
    }
    async findAllOperations(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
            AND: [
                this.buildAnnexeFilter(user),
                params?.annexeId ? { annexeId: params.annexeId } : {},
                params?.clientId ? { clientId: params.clientId } : {},
            ],
        };
        return this.prisma.operationComptable.findMany({
            where,
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async nextOperationReference() {
        const last = await this.prisma.operationComptable.findFirst({
            where: { reference: { startsWith: 'OPC-' } },
            orderBy: { createdAt: 'desc' },
            select: { reference: true },
        });
        const lastNum = Number(String(last?.reference ?? '').replace(/^OPC-/, '')) || 0;
        for (let n = lastNum + 1; n < lastNum + 50; n++) {
            const candidate = `OPC-${n}`;
            const exists = await this.prisma.operationComptable.findUnique({
                where: { reference: candidate },
                select: { id: true },
            });
            if (!exists)
                return candidate;
        }
        return `OPC-${Date.now()}`;
    }
    async createOperation(user, data) {
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException("Vous ne pouvez pas créer d'opération pour cette annexe");
        }
        const montant = Number(data.montant);
        if (!Number.isFinite(montant) || montant <= 0) {
            throw new common_1.BadRequestException("Le montant de l'opération doit être supérieur à 0.");
        }
        if (data.type !== 'Entrée' && data.type !== 'Sortie') {
            throw new common_1.BadRequestException("Le type doit être « Entrée » ou « Sortie ».");
        }
        const reference = data.reference &&
            !(await this.prisma.operationComptable.findUnique({
                where: { reference: data.reference },
                select: { id: true },
            }))
            ? data.reference
            : await this.nextOperationReference();
        const buildData = (ref) => ({
            reference: ref,
            annexeId: data.annexeId || null,
            date: data.date || new Date().toISOString().slice(0, 10),
            clientId: data.clientId || null,
            dossierId: data.dossierId || null,
            clientNom: data.clientNom || null,
            nature: data.nature,
            type: data.type,
            montant,
            modePaiement: data.modePaiement || 'Espèces',
            source: data.source || 'saisie',
            importRef: data.importRef || null,
            creePar: user.nom,
        });
        try {
            return await this.prisma.operationComptable.create({
                data: buildData(reference),
                include: { annexe: true },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                const retryReference = await this.nextOperationReference();
                return this.prisma.operationComptable.create({
                    data: buildData(retryReference),
                    include: { annexe: true },
                });
            }
            throw err;
        }
    }
    async deleteOperation(id, user) {
        const existing = await this.prisma.operationComptable.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Opération ${id} non trouvée`);
        if (existing.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette opération');
        }
        await this.prisma.operationComptable.delete({ where: { id } });
        return { id };
    }
    async findAllClotures(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
            AND: [
                this.buildAnnexeFilter(user),
                params?.annexeId ? { annexeId: params.annexeId } : {},
            ],
        };
        return this.prisma.clotureCaisse.findMany({
            where,
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createCloture(user, data) {
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de clôture pour cette annexe');
        }
        const soldeTheorique = Number(data.soldeTheorique) || 0;
        const soldeConstate = Number(data.soldeConstate) || 0;
        const ecart = Math.round((soldeConstate - soldeTheorique) * 100) / 100;
        if (!data.periodeDebut || !data.periodeFin) {
            throw new common_1.BadRequestException('La période de clôture (début et fin) est obligatoire.');
        }
        const iso = /^\d{4}-\d{2}-\d{2}/;
        if (iso.test(data.periodeDebut) && iso.test(data.periodeFin) && data.periodeDebut > data.periodeFin) {
            throw new common_1.BadRequestException('La date de début de période est postérieure à la date de fin.');
        }
        const dejaCloturee = await this.prisma.clotureCaisse.findFirst({
            where: {
                annexeId: data.annexeId || null,
                periodeDebut: data.periodeDebut,
                periodeFin: data.periodeFin,
            },
            select: { id: true },
        });
        if (dejaCloturee) {
            throw new common_1.ConflictException('Cette période a déjà été clôturée pour cette annexe.');
        }
        try {
            return await this.prisma.clotureCaisse.create({
                data: {
                    annexeId: data.annexeId || null,
                    periodeDebut: data.periodeDebut,
                    periodeFin: data.periodeFin,
                    soldeTheorique,
                    soldeConstate,
                    ecart,
                    note: data.note || null,
                    cloturePar: user.nom,
                    clotureLe: data.clotureLe || new Date().toISOString(),
                },
                include: { annexe: true },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new common_1.ConflictException('Cette période a déjà été clôturée pour cette annexe.');
            }
            throw err;
        }
    }
};
exports.ComptabiliteService = ComptabiliteService;
exports.ComptabiliteService = ComptabiliteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComptabiliteService);
//# sourceMappingURL=comptabilite.service.js.map