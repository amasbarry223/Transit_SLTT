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
exports.PortsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PortsService = class PortsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.port.findMany({
            orderBy: { nom: 'asc' },
        });
    }
    async findOne(id) {
        const port = await this.prisma.port.findUnique({ where: { id } });
        if (!port)
            throw new common_1.NotFoundException(`Port ${id} non trouvé`);
        return port;
    }
    async create(data) {
        const existing = await this.prisma.port.findUnique({ where: { code: data.code } });
        if (existing) {
            if (!existing.actif) {
                const { nom, ville, pays } = data;
                return this.prisma.port.update({
                    where: { id: existing.id },
                    data: { nom, ville, pays, actif: true },
                });
            }
            throw new common_1.ConflictException(`Un port avec le code ${data.code} existe déjà`);
        }
        const { code, nom, ville, pays } = data;
        return this.prisma.port.create({ data: { code, nom, ville, pays } });
    }
    async update(id, data) {
        await this.findOne(id);
        const updateData = {};
        for (const k of ['code', 'nom', 'ville', 'pays', 'actif']) {
            if (data[k] !== undefined)
                updateData[k] = data[k];
        }
        return this.prisma.port.update({ where: { id }, data: updateData });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.port.update({ where: { id }, data: { actif: false } });
    }
};
exports.PortsService = PortsService;
exports.PortsService = PortsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PortsService);
//# sourceMappingURL=ports.service.js.map