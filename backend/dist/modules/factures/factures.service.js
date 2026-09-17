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
var FacturesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacturesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const annexe_filter_utils_1 = require("../../common/annexe-filter.utils");
const pagination_utils_1 = require("../../common/pagination.utils");
let FacturesService = class FacturesService {
    static { FacturesService_1 = this; }
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDefaultTauxTva() {
        const setting = await this.prisma.setting.findUnique({
            where: { cle: 'facturation_taux_tva' },
        });
        const parsed = setting ? Number(setting.valeur) : NaN;
        return Number.isFinite(parsed) ? parsed : 18;
    }
    async findAll(user, query) {
        const { page, limit, skip } = (0, pagination_utils_1.parsePagination)(query, 20);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, query.annexeId, 'cette annexe');
        const where = {
            ...(0, annexe_filter_utils_1.buildAnnexeScopeFilter)(user),
            ...(query.annexeId ? { annexeId: query.annexeId } : {}),
            ...(query.statut ? { statut: query.statut } : {}),
            ...(query.clientId ? { clientId: query.clientId } : {}),
            ...(query.dossierId ? { dossierId: query.dossierId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { numero: { contains: query.search } },
                        { client: { nom: { contains: query.search } } },
                    ],
                }
                : {}),
        };
        const [total, data] = await Promise.all([
            this.prisma.facture.count({ where }),
            this.prisma.facture.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: { select: { id: true, nom: true, code: true } },
                    annexe: { select: { id: true, nom: true, code: true } },
                    dossier: { select: { id: true, numero: true } },
                    lignes: true,
                },
            }),
        ]);
        return (0, pagination_utils_1.buildPaginatedResponse)(data, total, { page, limit });
    }
    async findOne(id, user) {
        const facture = await this.prisma.facture.findUnique({
            where: { id },
            include: {
                client: true,
                annexe: true,
                dossier: true,
                lignes: true,
                transactions: { include: { caisse: true } },
                creePar: { select: { id: true, nom: true, email: true } },
            },
        });
        if (!facture)
            throw new common_1.NotFoundException(`Facture ${id} non trouvée`);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, facture.annexeId, 'cette facture');
        return facture;
    }
    async create(user, data) {
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, data.annexeId, 'cette annexe');
        const existing = await this.prisma.facture.findUnique({ where: { numero: data.numero } });
        if (existing)
            throw new common_1.ConflictException(`Le numéro de facture ${data.numero} existe déjà`);
        const { lignes, montantPaye: _mp, montantHt: _mht, montantTva: _mtva, montantTtc: _mttc, statut: _st, creeParId: _cp, id: _id, createdAt: _ca, updatedAt: _ua, ...factureData } = data;
        const { montantHt, tauxTva, montantTva, montantTtc, lignesFormatted } = this.computeTotals(lignes, factureData.tauxTva, await this.getDefaultTauxTva());
        const dateEmission = factureData.dateEmission ? new Date(factureData.dateEmission) : new Date();
        const dateEcheance = factureData.dateEcheance ? new Date(factureData.dateEcheance) : undefined;
        return this.prisma.facture.create({
            data: {
                ...factureData,
                dateEmission,
                dateEcheance,
                creeParId: user.id,
                montantHt,
                tauxTva,
                montantTva,
                montantTtc,
                lignes: {
                    create: lignesFormatted,
                },
            },
            include: { lignes: true, client: true },
        });
    }
    computeTotals(lignes, tauxTvaRaw, defaultTauxTva) {
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
        const tauxTva = tauxTvaRaw !== undefined ? Number(tauxTvaRaw) : defaultTauxTva;
        const montantTva = Math.round((montantHt * tauxTva) / 100);
        return { montantHt, tauxTva, montantTva, montantTtc: montantHt + montantTva, lignesFormatted };
    }
    async update(id, user, data) {
        const facture = await this.findOne(id, user);
        if (facture.montantPaye > 0 || facture.statut === 'PAYEE' || facture.statut === 'PARTIELLEMENT_PAYEE') {
            throw new common_1.BadRequestException('Une facture déjà encaissée ne peut plus être modifiée.');
        }
        if (facture.statut === 'ANNULEE') {
            throw new common_1.BadRequestException('Une facture annulée ne peut plus être modifiée.');
        }
        const hasLignes = Array.isArray(data.lignes);
        const totals = hasLignes
            ? this.computeTotals(data.lignes, data.tauxTva, await this.getDefaultTauxTva())
            : null;
        return this.prisma.$transaction(async (tx) => {
            if (hasLignes) {
                await tx.ligneFacture.deleteMany({ where: { factureId: id } });
            }
            return tx.facture.update({
                where: { id },
                data: {
                    clientId: data.clientId ?? facture.clientId,
                    dossierId: data.dossierId ?? null,
                    dateEmission: data.dateEmission ? new Date(data.dateEmission) : facture.dateEmission,
                    dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
                    notes: data.notes ?? null,
                    ...(totals
                        ? {
                            montantHt: totals.montantHt,
                            tauxTva: totals.tauxTva,
                            montantTva: totals.montantTva,
                            montantTtc: totals.montantTtc,
                            lignes: { create: totals.lignesFormatted },
                        }
                        : {}),
                },
                include: { lignes: true, client: true },
            });
        });
    }
    static STATUT_TRANSITIONS = {
        BROUILLON: ['ENVOYEE', 'ANNULEE'],
        ENVOYEE: ['ANNULEE', 'BROUILLON'],
        RETARD: ['ANNULEE'],
        PARTIELLEMENT_PAYEE: ['ANNULEE'],
        PAYEE: ['ANNULEE'],
        ANNULEE: [],
    };
    static FR_TO_PRISMA_STATUT = {
        Brouillon: 'BROUILLON',
        'Envoyée': 'ENVOYEE',
        Partielle: 'PARTIELLEMENT_PAYEE',
        'Soldée': 'PAYEE',
        'Annulée': 'ANNULEE',
    };
    async updateStatut(id, user, statutRaw) {
        const facture = await this.findOne(id, user);
        const target = FacturesService_1.FR_TO_PRISMA_STATUT[statutRaw] ?? String(statutRaw).toUpperCase();
        if (target === 'PAYEE' || target === 'PARTIELLEMENT_PAYEE') {
            throw new common_1.BadRequestException('Pour solder une facture, enregistrez un encaissement.');
        }
        const allowed = FacturesService_1.STATUT_TRANSITIONS[facture.statut] ?? [];
        if (facture.statut !== target && !allowed.includes(target)) {
            throw new common_1.BadRequestException(`Transition de statut interdite : ${facture.statut} → ${target}.`);
        }
        if (target === 'BROUILLON' && facture.montantPaye > 0) {
            throw new common_1.BadRequestException('Une facture déjà encaissée ne peut pas repasser en brouillon.');
        }
        return this.prisma.facture.update({
            where: { id },
            data: { statut: target },
            include: { lignes: true, client: true },
        });
    }
    async remove(id, user) {
        const facture = await this.findOne(id, user);
        if (facture.montantPaye > 0 || facture.transactions.length > 0) {
            throw new common_1.BadRequestException('Impossible de supprimer une facture avec des encaissements. Annulez-la plutôt.');
        }
        await this.prisma.facture.delete({ where: { id } });
        return { id };
    }
    async enregistrerPaiement(id, user, data) {
        const facture = await this.findOne(id, user);
        const montant = Number(data.montant);
        if (!Number.isFinite(montant) || montant <= 0) {
            throw new common_1.BadRequestException('Le montant du paiement doit être supérieur à 0.');
        }
        if (facture.statut === 'BROUILLON' || facture.statut === 'ANNULEE') {
            throw new common_1.BadRequestException(`Impossible d'encaisser sur une facture ${facture.statut === 'BROUILLON' ? 'brouillon' : 'annulée'}.`);
        }
        const reste = facture.montantTtc - facture.montantPaye;
        if (montant > reste + 0.5) {
            throw new common_1.BadRequestException(`Le montant dépasse le reste dû (${reste.toLocaleString('fr-FR')}).`);
        }
        const caisse = await this.prisma.caisse.findUnique({ where: { id: data.caisseId } });
        if (!caisse)
            throw new common_1.NotFoundException('Caisse introuvable.');
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(caisse.annexeId)) {
            throw new common_1.ForbiddenException("Cette caisse n'appartient pas à votre annexe.");
        }
        if (caisse.annexeId !== facture.annexeId) {
            throw new common_1.BadRequestException("La caisse sélectionnée n'appartient pas à l'annexe de cette facture.");
        }
        if (caisse.statut === 'FERMEE') {
            throw new common_1.BadRequestException('Cette caisse est fermée aux opérations.');
        }
        return this.prisma.$transaction(async (tx) => {
            const incremented = await tx.facture.update({
                where: { id },
                data: { montantPaye: { increment: montant } },
            });
            if (incremented.montantPaye > incremented.montantTtc + 0.5) {
                throw new common_1.BadRequestException('Le montant dépasse le reste dû.');
            }
            const statut = incremented.montantPaye >= facture.montantTtc - 0.5 ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';
            const updatedFacture = await tx.facture.update({
                where: { id },
                data: { statut },
            });
            await tx.transactionCaisse.create({
                data: {
                    caisseId: data.caisseId,
                    type: 'ENTREE',
                    montant,
                    motif: data.motif || `Paiement facture ${facture.numero}`,
                    factureId: facture.id,
                    effectueParId: user.id,
                },
            });
            await tx.caisse.update({
                where: { id: data.caisseId },
                data: { soldeActuel: { increment: montant } },
            });
            return updatedFacture;
        });
    }
};
exports.FacturesService = FacturesService;
exports.FacturesService = FacturesService = FacturesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FacturesService);
//# sourceMappingURL=factures.service.js.map