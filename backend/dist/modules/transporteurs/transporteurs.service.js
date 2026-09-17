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
exports.TransporteursService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function toNonNegativeCapacite(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n < 0) {
        throw new common_1.BadRequestException('La capacité ne peut pas être négative.');
    }
    return n;
}
let TransporteursService = class TransporteursService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
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
                            { nom: { contains: params.search } },
                            { immatriculation: { contains: params.search } },
                            { telephone: { contains: params.search } },
                        ],
                    }
                    : {},
            ],
        };
        return this.prisma.transporteur.findMany({
            where,
            include: { annexe: { select: { id: true, nom: true, code: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        const item = await this.prisma.transporteur.findUnique({
            where: { id },
            include: { annexe: true },
        });
        if (!item)
            throw new common_1.NotFoundException(`Transporteur ${id} non trouvé`);
        if (item.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(item.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce transporteur');
        }
        return item;
    }
    async create(user, data) {
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de transporteur pour cette annexe');
        }
        return this.prisma.transporteur.create({
            data: {
                nom: data.nom,
                contact: data.contact || null,
                telephone: data.telephone,
                email: data.email || null,
                vehicule: data.vehicule,
                immatriculation: data.immatriculation,
                trajet: data.trajet || null,
                capacite: toNonNegativeCapacite(data.capacite),
                statut: data.statut || 'DISPONIBLE',
                dateCreation: data.dateCreation || new Date().toISOString().slice(0, 10),
                notes: data.notes || null,
                annexeId: data.annexeId || null,
            },
            include: { annexe: true },
        });
    }
    async update(id, user, data) {
        await this.findOne(id, user);
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas rattacher ce transporteur à cette annexe');
        }
        const updateData = {};
        for (const k of ['nom', 'contact', 'telephone', 'email', 'vehicule', 'immatriculation', 'trajet', 'statut', 'notes', 'annexeId']) {
            if (data[k] !== undefined)
                updateData[k] = data[k];
        }
        if (data.capacite !== undefined)
            updateData.capacite = toNonNegativeCapacite(data.capacite);
        return this.prisma.transporteur.update({
            where: { id },
            data: updateData,
            include: { annexe: true },
        });
    }
    async delete(id, user) {
        await this.findOne(id, user);
        return this.prisma.transporteur.delete({ where: { id } });
    }
};
exports.TransporteursService = TransporteursService;
exports.TransporteursService = TransporteursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransporteursService);
//# sourceMappingURL=transporteurs.service.js.map