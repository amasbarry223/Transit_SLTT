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
var ContratsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContratsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function toNonNegativeMontant(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n < 0) {
        throw new common_1.BadRequestException('Le montant du contrat ne peut pas être négatif.');
    }
    return n;
}
let ContratsService = class ContratsService {
    static { ContratsService_1 = this; }
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    static STATUT_TRANSITIONS = {
        'En cours': ['Exécuté'],
        'Exécuté': ['En cours'],
        Actif: ['Exécuté', 'En cours', 'Suspendu', 'Clôturé'],
        Suspendu: ['En cours', 'Exécuté', 'Actif', 'Clôturé'],
        'Clôturé': ['En cours', 'Exécuté', 'Actif'],
    };
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
                params?.clientId ? { clientId: params.clientId } : {},
                params?.search
                    ? {
                        OR: [
                            { reference: { contains: params.search } },
                            { objet: { contains: params.search } },
                            { client: { nom: { contains: params.search } } },
                        ],
                    }
                    : {},
            ],
        };
        return this.prisma.contrat.findMany({
            where,
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
                client: { select: { id: true, nom: true } },
                prestations: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        let contrat = await this.prisma.contrat.findUnique({
            where: { id },
            include: {
                annexe: true,
                client: true,
            },
        });
        if (!contrat) {
            contrat = await this.prisma.contrat.findUnique({
                where: { reference: id },
                include: {
                    annexe: true,
                    client: true,
                },
            });
        }
        if (!contrat)
            throw new common_1.NotFoundException(`Contrat ${id} non trouvé`);
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(contrat.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce contrat');
        }
        return contrat;
    }
    async create(user, data) {
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de contrat pour cette annexe');
        }
        if (data.reference) {
            const existing = await this.prisma.contrat.findUnique({ where: { reference: data.reference } });
            if (existing)
                throw new common_1.ConflictException(`La référence de contrat ${data.reference} existe déjà`);
        }
        const dateDebut = data.dateDebut ? new Date(data.dateDebut) : new Date();
        const dateFin = data.dateFin ? new Date(data.dateFin) : undefined;
        if (dateFin && dateFin < dateDebut) {
            throw new common_1.BadRequestException('La date de fin du contrat est antérieure à sa date de début.');
        }
        const statut = data.statut || 'Actif';
        if (!(statut in ContratsService_1.STATUT_TRANSITIONS)) {
            throw new common_1.BadRequestException(`Statut de contrat inconnu : ${statut}.`);
        }
        return this.prisma.contrat.create({
            data: {
                reference: data.reference,
                annexeId: data.annexeId,
                clientId: data.clientId,
                objet: data.objet,
                dateDebut,
                dateFin,
                montant: toNonNegativeMontant(data.montant),
                statut,
                notes: data.notes || undefined,
                creePar: user.nom,
            },
            include: {
                annexe: true,
                client: true,
            },
        });
    }
    async update(id, user, data) {
        const contrat = await this.findOne(id, user);
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas rattacher ce contrat à cette annexe');
        }
        if (data.statut !== undefined && data.statut !== contrat.statut) {
            const allowed = ContratsService_1.STATUT_TRANSITIONS[contrat.statut] ?? [];
            if (!allowed.includes(data.statut)) {
                throw new common_1.BadRequestException(`Transition de statut interdite : ${contrat.statut} → ${data.statut}.`);
            }
        }
        const updateData = {};
        if (data.reference !== undefined) {
            const clash = await this.prisma.contrat.findUnique({ where: { reference: data.reference } });
            if (clash && clash.id !== id) {
                throw new common_1.ConflictException(`La référence de contrat ${data.reference} existe déjà`);
            }
            updateData.reference = data.reference;
        }
        if (data.annexeId !== undefined)
            updateData.annexeId = data.annexeId;
        if (data.clientId !== undefined)
            updateData.clientId = data.clientId;
        if (data.objet !== undefined)
            updateData.objet = data.objet;
        if (data.dateDebut !== undefined)
            updateData.dateDebut = new Date(data.dateDebut);
        if (data.dateFin !== undefined)
            updateData.dateFin = data.dateFin ? new Date(data.dateFin) : null;
        if (data.montant !== undefined)
            updateData.montant = toNonNegativeMontant(data.montant);
        if (data.statut !== undefined)
            updateData.statut = data.statut;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        const debut = updateData.dateDebut ?? contrat.dateDebut;
        const fin = updateData.dateFin !== undefined ? updateData.dateFin : contrat.dateFin;
        if (fin && debut && fin < debut) {
            throw new common_1.BadRequestException('La date de fin du contrat est antérieure à sa date de début.');
        }
        return this.prisma.contrat.update({
            where: { id },
            data: updateData,
            include: {
                annexe: true,
                client: true,
            },
        });
    }
    async delete(id, user) {
        const contrat = await this.findOne(id, user);
        const nbPrestations = await this.prisma.contratPrestation.count({ where: { contratId: contrat.id } });
        if (nbPrestations > 0) {
            throw new common_1.BadRequestException(`Impossible de supprimer ce contrat : il comporte ${nbPrestations} prestation(s). Supprimez-les d'abord.`);
        }
        return this.prisma.contrat.delete({ where: { id: contrat.id } });
    }
    async addPrestation(contratId, user, data) {
        const contrat = await this.findOne(contratId, user);
        return this.prisma.contratPrestation.create({
            data: {
                contratId: contrat.id,
                libelle: String(data.libelle || '').trim() || 'Prestation',
                description: data.description || null,
                montant: data.montant ?? null,
                statut: data.statut || 'Prévue',
                datePrevue: data.datePrevue || null,
                dateRealisation: data.dateRealisation || null,
                creePar: user.nom,
            },
        });
    }
    async findPrestation(contratId, prestationId, user) {
        const contrat = await this.findOne(contratId, user);
        const prestation = await this.prisma.contratPrestation.findFirst({
            where: { id: prestationId, contratId: contrat.id },
        });
        if (!prestation)
            throw new common_1.NotFoundException(`Prestation ${prestationId} non trouvée`);
        return prestation;
    }
    async updatePrestation(contratId, prestationId, user, data) {
        const prestation = await this.findPrestation(contratId, prestationId, user);
        const patch = {};
        for (const k of ['libelle', 'description', 'montant', 'statut', 'datePrevue', 'dateRealisation', 'facturee']) {
            if (data[k] !== undefined)
                patch[k] = data[k];
        }
        return this.prisma.contratPrestation.update({ where: { id: prestation.id }, data: patch });
    }
    async removePrestation(contratId, prestationId, user) {
        const prestation = await this.findPrestation(contratId, prestationId, user);
        if (prestation.facturee) {
            throw new common_1.BadRequestException('Une prestation déjà facturée ne peut pas être supprimée.');
        }
        await this.prisma.contratPrestation.delete({ where: { id: prestation.id } });
        return { id: prestation.id };
    }
};
exports.ContratsService = ContratsService;
exports.ContratsService = ContratsService = ContratsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContratsService);
//# sourceMappingURL=contrats.service.js.map