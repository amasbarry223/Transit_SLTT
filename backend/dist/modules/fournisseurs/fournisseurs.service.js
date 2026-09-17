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
exports.FournisseursService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let FournisseursService = class FournisseursService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(search) {
        return this.prisma.fournisseur.findMany({
            where: {
                actif: true,
                ...(search
                    ? {
                        OR: [
                            { nom: { contains: search } },
                            { code: { contains: search } },
                        ],
                    }
                    : {}),
            },
            orderBy: { nom: 'asc' },
            include: {
                _count: { select: { depenses: true } },
            },
        });
    }
    async findOne(id) {
        const fournisseur = await this.prisma.fournisseur.findUnique({
            where: { id },
            include: {
                depenses: { take: 10, orderBy: { createdAt: 'desc' } },
                _count: { select: { depenses: true } },
            },
        });
        if (!fournisseur)
            throw new common_1.NotFoundException(`Fournisseur ${id} non trouvé`);
        return fournisseur;
    }
    async create(data) {
        const code = data.code || `FRN-${Date.now().toString(36).toUpperCase()}`;
        const existing = await this.prisma.fournisseur.findUnique({ where: { code } });
        if (existing)
            throw new common_1.ConflictException(`Le fournisseur avec le code ${code} existe déjà`);
        return this.prisma.fournisseur.create({
            data: {
                code,
                nom: data.nom,
                type: data.type || 'Autre',
                contact: data.contact || null,
                telephone: data.telephone || null,
                email: data.email || null,
                adresse: data.adresse || null,
                rccm: data.rccm || null,
                nif: data.nif || null,
                actif: data.actif ?? true,
            },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        const updateData = {};
        if (data.nom !== undefined)
            updateData.nom = data.nom;
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.contact !== undefined)
            updateData.contact = data.contact;
        if (data.telephone !== undefined)
            updateData.telephone = data.telephone;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.adresse !== undefined)
            updateData.adresse = data.adresse;
        if (data.rccm !== undefined)
            updateData.rccm = data.rccm;
        if (data.nif !== undefined)
            updateData.nif = data.nif;
        if (data.actif !== undefined)
            updateData.actif = data.actif;
        return this.prisma.fournisseur.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.fournisseur.update({
            where: { id },
            data: { actif: false },
        });
    }
};
exports.FournisseursService = FournisseursService;
exports.FournisseursService = FournisseursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FournisseursService);
//# sourceMappingURL=fournisseurs.service.js.map