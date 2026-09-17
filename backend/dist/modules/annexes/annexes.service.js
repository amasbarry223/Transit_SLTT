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
exports.AnnexesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnnexesService = class AnnexesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.annexe.findMany({
            where: { actif: true },
            orderBy: { nom: 'asc' },
        });
    }
    async findOne(id) {
        const annexe = await this.prisma.annexe.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { dossiers: true, factures: true, caisses: true },
                },
            },
        });
        if (!annexe)
            throw new common_1.NotFoundException(`Annexe ${id} non trouvée`);
        return annexe;
    }
    async create(data) {
        const existing = await this.prisma.annexe.findUnique({ where: { code: data.code } });
        if (existing)
            throw new common_1.ConflictException(`Une annexe avec le code ${data.code} existe déjà`);
        const { code, nom, adresse, ville, pays, telephone, email, rccm, nif, estSiege } = data;
        return this.prisma.annexe.create({
            data: { code, nom, adresse, ville, pays, telephone, email, rccm, nif, estSiege },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        const updateData = {};
        for (const k of ['nom', 'adresse', 'ville', 'pays', 'telephone', 'email', 'rccm', 'nif', 'estSiege', 'actif']) {
            if (data[k] !== undefined)
                updateData[k] = data[k];
        }
        if (data.villeSiege !== undefined && updateData.ville === undefined) {
            updateData.ville = data.villeSiege;
        }
        return this.prisma.annexe.update({ where: { id }, data: updateData });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.annexe.update({ where: { id }, data: { actif: false } });
    }
};
exports.AnnexesService = AnnexesService;
exports.AnnexesService = AnnexesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnnexesService);
//# sourceMappingURL=annexes.service.js.map