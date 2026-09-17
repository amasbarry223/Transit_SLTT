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
exports.DevisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ports_service_1 = require("../ports/ports.service");
function computeDevisTotals(lignes) {
    let montantHt = 0;
    const lignesFormatted = (lignes || []).map((l) => {
        const quantite = Number(l.quantite);
        if (!Number.isFinite(quantite) || quantite <= 0) {
            throw new common_1.BadRequestException('La quantité de chaque ligne doit être un nombre supérieur à 0.');
        }
        const prixUnitaire = Number(l.prixUnitaire);
        if (!Number.isFinite(prixUnitaire) || prixUnitaire < 0) {
            throw new common_1.BadRequestException('Le prix unitaire de chaque ligne ne peut pas être négatif.');
        }
        const montantTotal = quantite * prixUnitaire;
        montantHt += montantTotal;
        return { designation: l.designation, quantite, prixUnitaire, montantTotal };
    });
    return { montantHt, montantTva: 0, montantTtc: montantHt, lignesFormatted };
}
let DevisService = class DevisService {
    prisma;
    portsService;
    constructor(prisma, portsService) {
        this.prisma = prisma;
        this.portsService = portsService;
    }
    async assertPortUsable(portId) {
        const port = await this.portsService.findOne(portId);
        if (!port.actif) {
            throw new common_1.BadRequestException(`Le port "${port.nom}" est désactivé et ne peut plus être sélectionné.`);
        }
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
    }
    async findAll(user, clientId) {
        return this.prisma.devis.findMany({
            where: {
                ...this.buildAnnexeFilter(user),
                ...(clientId ? { clientId } : {}),
            },
            include: {
                client: { select: { id: true, nom: true, code: true } },
                annexe: { select: { id: true, nom: true, code: true } },
                port: { select: { id: true, nom: true, code: true } },
                lignes: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        let devis = await this.prisma.devis.findUnique({
            where: { id },
            include: { client: true, annexe: true, port: true, lignes: true },
        });
        if (!devis) {
            devis = await this.prisma.devis.findUnique({
                where: { numero: id },
                include: { client: true, annexe: true, port: true, lignes: true },
            });
        }
        if (!devis)
            throw new common_1.NotFoundException(`Devis ${id} non trouvé`);
        if (devis.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(devis.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce devis');
        }
        return devis;
    }
    async create(user, data) {
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de devis pour cette annexe');
        }
        const existing = await this.prisma.devis.findUnique({ where: { numero: data.numero } });
        if (existing)
            throw new common_1.ConflictException(`Le numéro de devis ${data.numero} existe déjà`);
        if (data.portId)
            await this.assertPortUsable(data.portId);
        const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(data.lignes);
        return this.prisma.devis.create({
            data: {
                numero: data.numero,
                clientId: data.clientId,
                annexeId: data.annexeId || null,
                dossierId: data.dossierId || null,
                portId: data.portId || null,
                nature: data.nature || null,
                dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
                dateValidite: data.dateValidite ? new Date(data.dateValidite) : undefined,
                notes: data.notes ?? null,
                montantHt,
                montantTva,
                montantTtc,
                lignes: { create: lignesFormatted },
            },
            include: { lignes: true, client: true, annexe: true, port: true },
        });
    }
    async update(id, user, data) {
        const current = await this.findOne(id, user);
        if (current.statut === 'ACCEPTE') {
            throw new common_1.BadRequestException('Ce devis est déjà accepté et ne peut plus être modifié.');
        }
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas rattacher ce devis à cette annexe');
        }
        const updateData = {};
        if (data.clientId !== undefined)
            updateData.clientId = data.clientId;
        if (data.annexeId !== undefined)
            updateData.annexeId = data.annexeId || null;
        if (data.dossierId !== undefined) {
            if (current.dossierId && data.dossierId && current.dossierId !== data.dossierId) {
                throw new common_1.ConflictException('Ce devis est déjà rattaché à un dossier.');
            }
            updateData.dossierId = data.dossierId || null;
        }
        if (data.portId !== undefined) {
            if (data.portId)
                await this.assertPortUsable(data.portId);
            updateData.portId = data.portId || null;
        }
        if (data.nature !== undefined)
            updateData.nature = data.nature || null;
        if (data.notes !== undefined)
            updateData.notes = data.notes ?? null;
        if (data.statut !== undefined)
            updateData.statut = data.statut;
        if (data.dateEmission)
            updateData.dateEmission = new Date(data.dateEmission);
        if (data.dateValidite)
            updateData.dateValidite = new Date(data.dateValidite);
        if (data.lignes) {
            const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(data.lignes);
            updateData.montantHt = montantHt;
            updateData.montantTva = montantTva;
            updateData.montantTtc = montantTtc;
            updateData.lignes = { create: lignesFormatted };
        }
        return this.prisma.$transaction(async (tx) => {
            if (data.lignes) {
                await tx.ligneDevis.deleteMany({ where: { devisId: id } });
            }
            return tx.devis.update({
                where: { id },
                data: updateData,
                include: { lignes: true, client: true, annexe: true, port: true },
            });
        });
    }
    async delete(id, user) {
        const devis = await this.findOne(id, user);
        return this.prisma.devis.delete({ where: { id: devis.id } });
    }
};
exports.DevisService = DevisService;
exports.DevisService = DevisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ports_service_1.PortsService])
], DevisService);
//# sourceMappingURL=devis.service.js.map