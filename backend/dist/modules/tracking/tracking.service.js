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
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TrackingService = class TrackingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublicTracking(codeTracking) {
        const tracking = await this.prisma.trackingPublic.findUnique({
            where: { codeTracking: codeTracking.trim() },
            include: {
                dossier: {
                    select: {
                        numero: true,
                        type: true,
                        statut: true,
                        voieTransport: true,
                        marchandise: true,
                        navireVol: true,
                        compagnie: true,
                        numeroBl: true,
                        portProvenance: true,
                        portDestination: true,
                        dateDepart: true,
                        dateArriveePrevue: true,
                        dateArriveeEffective: true,
                        dateLivraison: true,
                        conteneurs: {
                            select: {
                                numero: true,
                                type: true,
                                statut: true,
                            },
                        },
                        etapes: {
                            orderBy: { ordre: 'asc' },
                            select: {
                                titre: true,
                                description: true,
                                completee: true,
                                dateEffective: true,
                            },
                        },
                    },
                },
            },
        });
        if (!tracking || !tracking.actif) {
            throw new common_1.NotFoundException("Numéro de suivi introuvable ou inactif");
        }
        return tracking;
    }
    async updateTrackingPosition(dossierId, user, data) {
        const dossier = await this.prisma.dossier.findUnique({
            where: { id: dossierId },
            select: { annexeId: true },
        });
        if (!dossier)
            throw new common_1.NotFoundException(`Dossier ${dossierId} non trouvé`);
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(dossier.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce dossier');
        }
        return this.prisma.trackingPublic.upsert({
            where: { dossierId },
            create: {
                dossierId,
                codeTracking: `TRK-${dossierId.slice(0, 8).toUpperCase()}`,
                dernierePosition: data.dernierePosition,
                statutAffiche: data.statutAffiche,
            },
            update: data,
        });
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map