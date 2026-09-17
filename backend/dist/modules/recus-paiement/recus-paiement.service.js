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
exports.RecusPaiementService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
function statutRecu(somme, montantPaye) {
    const reste = Math.max(0, Math.round((somme - montantPaye) * 100) / 100);
    if (reste < 0.5)
        return 'SOLDE';
    return montantPaye > 0 ? 'PARTIEL' : 'EN_ATTENTE';
}
function toNonNegativeAmount(value, label) {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n < 0) {
        throw new common_1.BadRequestException(`${label} ne peut pas être négatif.`);
    }
    return n;
}
let RecusPaiementService = class RecusPaiementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { annexeId: { in: user.annexeIds } };
    }
    async findAll(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
            AND: [
                this.buildAnnexeFilter(user),
                params?.annexeId ? { annexeId: params.annexeId } : {},
                params?.search
                    ? {
                        OR: [
                            { reference: { contains: params.search } },
                            { nom: { contains: params.search } },
                            { prenom: { contains: params.search } },
                            { motif: { contains: params.search } },
                        ],
                    }
                    : {},
            ],
        };
        return this.prisma.recuPaiement.findMany({
            where,
            include: { annexe: { select: { id: true, nom: true, code: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        const item = await this.prisma.recuPaiement.findUnique({
            where: { id },
            include: { annexe: true },
        });
        if (!item)
            throw new common_1.NotFoundException(`Reçu ${id} non trouvé`);
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(item.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce reçu');
        }
        return item;
    }
    async nextRecuReference() {
        const last = await this.prisma.recuPaiement.findFirst({
            where: { reference: { startsWith: 'RECU-' } },
            orderBy: { createdAt: 'desc' },
            select: { reference: true },
        });
        const lastNum = Number(String(last?.reference ?? '').replace(/^RECU-/, '')) || 0;
        for (let n = lastNum + 1; n < lastNum + 50; n++) {
            const candidate = `RECU-${String(n).padStart(4, '0')}`;
            const exists = await this.prisma.recuPaiement.findUnique({
                where: { reference: candidate },
                select: { id: true },
            });
            if (!exists)
                return candidate;
        }
        return `RECU-${Date.now()}`;
    }
    async create(user, data) {
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de reçu pour cette annexe');
        }
        const somme = toNonNegativeAmount(data.somme, 'La somme due');
        const montantPaye = toNonNegativeAmount(data.montantPaye, 'Le montant payé');
        const reste = Math.max(0, Math.round((somme - montantPaye) * 100) / 100);
        const statut = statutRecu(somme, montantPaye);
        const buildData = (reference) => ({
            reference,
            annexeId: data.annexeId,
            nom: data.nom || '',
            prenom: data.prenom || '',
            somme,
            motif: data.motif || '',
            montantPaye,
            reste,
            statut,
            creePar: user.nom,
        });
        const reference = await this.nextRecuReference();
        try {
            return await this.prisma.recuPaiement.create({
                data: buildData(reference),
                include: { annexe: true },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                const retryReference = await this.nextRecuReference();
                return this.prisma.recuPaiement.create({
                    data: buildData(retryReference),
                    include: { annexe: true },
                });
            }
            throw err;
        }
    }
    async update(id, user, data) {
        const current = await this.findOne(id, user);
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas rattacher ce reçu à cette annexe');
        }
        const { reste: _r, statut: _s, id: _id, createdAt: _c, updatedAt: _u, creePar: _cp, ...safe } = data;
        const updateData = { ...safe };
        if (data.somme !== undefined || data.montantPaye !== undefined) {
            const somme = data.somme !== undefined ? toNonNegativeAmount(data.somme, 'La somme due') : current.somme;
            const montantPaye = data.montantPaye !== undefined
                ? toNonNegativeAmount(data.montantPaye, 'Le montant payé')
                : current.montantPaye;
            updateData.somme = somme;
            updateData.montantPaye = montantPaye;
            updateData.reste = Math.max(0, Math.round((somme - montantPaye) * 100) / 100);
            updateData.statut = statutRecu(somme, montantPaye);
        }
        return this.prisma.recuPaiement.update({
            where: { id },
            data: updateData,
            include: { annexe: true },
        });
    }
    async delete(id, user) {
        await this.findOne(id, user);
        return this.prisma.recuPaiement.delete({ where: { id } });
    }
};
exports.RecusPaiementService = RecusPaiementService;
exports.RecusPaiementService = RecusPaiementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecusPaiementService);
//# sourceMappingURL=recus-paiement.service.js.map