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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const annexe_filter_utils_1 = require("../../common/annexe-filter.utils");
function normalizeTypeClient(raw) {
    const upper = String(raw ?? '').toUpperCase();
    if (upper === 'PARTICULIER')
        return 'PARTICULIER';
    if (upper === 'ONG')
        return 'ONG';
    if (upper === 'ETAT' || upper === 'GOUVERNEMENT')
        return 'GOUVERNEMENT';
    return 'ENTREPRISE';
}
let ClientsService = class ClientsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(user, search) {
        return this.prisma.client.findMany({
            where: {
                actif: true,
                ...(0, annexe_filter_utils_1.buildAnnexeScopeFilter)(user, { allowUnassigned: true }),
                ...(search
                    ? {
                        OR: [
                            { nom: { contains: search } },
                            { code: { contains: search } },
                            { email: { contains: search } },
                        ],
                    }
                    : {}),
            },
            orderBy: { nom: 'asc' },
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
                _count: {
                    select: { dossiers: true, factures: true },
                },
            },
        });
    }
    async findOne(id, user) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
                dossiers: { take: 5, orderBy: { createdAt: 'desc' } },
                factures: { take: 5, orderBy: { createdAt: 'desc' } },
                _count: {
                    select: { dossiers: true, factures: true, devis: true, cotations: true },
                },
            },
        });
        if (!client)
            throw new common_1.NotFoundException(`Client ${id} non trouvé`);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, client.annexeId, 'ce client');
        return client;
    }
    async create(user, data) {
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, data.annexeId, 'cette annexe');
        const baseCode = data.code || `CLT-${Date.now().toString(36).toUpperCase()}`;
        const existing = await this.prisma.client.findUnique({ where: { code: baseCode } });
        const code = existing ? `CLT-${Math.floor(1000 + Math.random() * 9000)}` : baseCode;
        const type = normalizeTypeClient(data.type);
        return this.prisma.client.create({
            data: {
                code,
                nom: data.nom,
                type,
                email: data.email || null,
                telephone: data.telephone || null,
                adresse: data.adresse || null,
                ville: data.ville || null,
                pays: data.pays || 'Guinée',
                nif: data.nif || null,
                rccm: data.rccm || null,
                actif: data.actif ?? true,
                notes: data.notes || null,
                annexeId: data.annexeId || null,
            },
            include: { annexe: { select: { id: true, nom: true, code: true } } },
        });
    }
    async update(id, user, data) {
        await this.findOne(id, user);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, data.annexeId, 'cette annexe');
        const updateData = {};
        if (data.nom !== undefined)
            updateData.nom = data.nom;
        if (data.telephone !== undefined)
            updateData.telephone = data.telephone || null;
        if (data.email !== undefined)
            updateData.email = data.email || null;
        if (data.adresse !== undefined)
            updateData.adresse = data.adresse || null;
        if (data.ville !== undefined)
            updateData.ville = data.ville || null;
        if (data.pays !== undefined)
            updateData.pays = data.pays || 'Guinée';
        if (data.nif !== undefined)
            updateData.nif = data.nif || null;
        if (data.rccm !== undefined)
            updateData.rccm = data.rccm || null;
        if (data.actif !== undefined)
            updateData.actif = data.actif;
        if (data.notes !== undefined)
            updateData.notes = data.notes || null;
        if (data.type !== undefined)
            updateData.type = normalizeTypeClient(data.type);
        if (data.annexeId !== undefined)
            updateData.annexeId = data.annexeId || null;
        return this.prisma.client.update({
            where: { id },
            data: updateData,
            include: { annexe: { select: { id: true, nom: true, code: true } } },
        });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        return this.prisma.client.update({ where: { id }, data: { actif: false } });
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map