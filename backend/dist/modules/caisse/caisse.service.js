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
exports.CaisseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CaisseService = class CaisseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { annexeId: { in: user.annexeIds } };
    }
    async findAll(user, annexeId) {
        const annexeFilter = this.buildAnnexeFilter(user);
        if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        return this.prisma.caisse.findMany({
            where: {
                ...annexeFilter,
                ...(annexeId ? { annexeId } : {}),
            },
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
                _count: { select: { transactions: true } },
            },
            orderBy: { nom: 'asc' },
        });
    }
    async findOne(id, user) {
        const caisse = await this.prisma.caisse.findUnique({
            where: { id },
            include: {
                annexe: true,
                transactions: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        effectuePar: { select: { id: true, nom: true } },
                        facture: { select: { id: true, numero: true } },
                        depense: { select: { id: true, numero: true } },
                    },
                },
            },
        });
        if (!caisse)
            throw new common_1.NotFoundException(`Caisse ${id} non trouvée`);
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(caisse.annexeId)) {
            throw new common_1.ForbiddenException("Accès non autorisé à cette caisse");
        }
        return caisse;
    }
    async createTransaction(caisseId, user, data) {
        const caisse = await this.findOne(caisseId, user);
        if (caisse.statut === 'FERMEE') {
            throw new common_1.BadRequestException("Cette caisse est fermée aux opérations");
        }
        const montant = Number(data.montant);
        if (!Number.isFinite(montant) || montant <= 0) {
            throw new common_1.BadRequestException("Le montant doit être supérieur à 0");
        }
        if (data.type !== 'ENTREE' && data.type !== 'SORTIE') {
            throw new common_1.BadRequestException("Type de transaction invalide");
        }
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transactionCaisse.create({
                data: {
                    caisseId,
                    type: data.type,
                    montant,
                    motif: data.motif || 'Opération de caisse',
                    effectueParId: user.id,
                },
            });
            const increment = data.type === 'ENTREE' ? montant : -montant;
            const updatedCaisse = await tx.caisse.update({
                where: { id: caisseId },
                data: { soldeActuel: { increment } },
            });
            if (updatedCaisse.soldeActuel < 0) {
                throw new common_1.BadRequestException('Solde insuffisant dans la caisse');
            }
            return { transaction, soldeActuel: updatedCaisse.soldeActuel };
        });
    }
};
exports.CaisseService = CaisseService;
exports.CaisseService = CaisseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CaisseService);
//# sourceMappingURL=caisse.service.js.map