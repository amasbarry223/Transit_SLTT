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
exports.DepensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const annexe_filter_utils_1 = require("../../common/annexe-filter.utils");
const pagination_utils_1 = require("../../common/pagination.utils");
let DepensesService = class DepensesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(user, query) {
        const { page, limit, skip } = (0, pagination_utils_1.parsePagination)(query, 20);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, query.annexeId, 'cette annexe');
        const where = {
            ...(0, annexe_filter_utils_1.buildAnnexeScopeFilter)(user),
            ...(query.annexeId ? { annexeId: query.annexeId } : {}),
            ...(query.statut ? { statut: query.statut } : {}),
            ...(query.categorie ? { categorie: query.categorie } : {}),
            ...(query.dossierId ? { dossierId: query.dossierId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { numero: { contains: query.search } },
                        { description: { contains: query.search } },
                        { fournisseur: { nom: { contains: query.search } } },
                    ],
                }
                : {}),
        };
        const [total, data] = await Promise.all([
            this.prisma.depense.count({ where }),
            this.prisma.depense.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    annexe: { select: { id: true, nom: true, code: true } },
                    fournisseur: { select: { id: true, nom: true, code: true } },
                    dossier: { select: { id: true, numero: true } },
                },
            }),
        ]);
        return (0, pagination_utils_1.buildPaginatedResponse)(data, total, { page, limit });
    }
    async findOne(id, user) {
        const depense = await this.prisma.depense.findUnique({
            where: { id },
            include: {
                annexe: true,
                fournisseur: true,
                dossier: true,
                creePar: { select: { id: true, nom: true, email: true } },
                approuvePar: { select: { id: true, nom: true, email: true } },
                transactions: { include: { caisse: true } },
            },
        });
        if (!depense)
            throw new common_1.NotFoundException(`Dépense ${id} non trouvée`);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, depense.annexeId, 'cette dépense');
        return depense;
    }
    async create(user, data) {
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, data.annexeId, 'cette annexe');
        const existing = await this.prisma.depense.findUnique({ where: { numero: data.numero } });
        if (existing)
            throw new common_1.ConflictException(`Le numéro ${data.numero} existe déjà`);
        const montant = Number(data.montant);
        if (!Number.isFinite(montant) || montant <= 0) {
            throw new common_1.BadRequestException('Le montant de la dépense doit être un nombre supérieur à 0.');
        }
        if (data.fournisseurId) {
            const fournisseur = await this.prisma.fournisseur.findUnique({ where: { id: data.fournisseurId } });
            if (!fournisseur || !fournisseur.actif) {
                throw new common_1.BadRequestException('Fournisseur invalide ou désactivé.');
            }
        }
        const { statut: _st, approuveParId: _ap, creeParId: _cp, id: _id, ...depenseData } = data;
        return this.prisma.depense.create({
            data: {
                ...depenseData,
                montant,
                statut: 'EN_ATTENTE',
                creeParId: user.id,
            },
            include: { annexe: true, fournisseur: true },
        });
    }
    async approuver(id, user) {
        const depense = await this.findOne(id, user);
        if (depense.statut !== 'EN_ATTENTE') {
            throw new common_1.BadRequestException('Seule une dépense en attente peut être approuvée');
        }
        return this.prisma.depense.update({
            where: { id },
            data: {
                statut: 'APPROUVEE',
                approuveParId: user.id,
            },
        });
    }
    async remove(id, user) {
        const depense = await this.findOne(id, user);
        if (depense.statut === 'PAYEE' || depense.transactions.length > 0) {
            throw new common_1.BadRequestException('Impossible de supprimer une dépense déjà payée. Elle est liée à un mouvement de caisse.');
        }
        await this.prisma.depense.delete({ where: { id } });
        return { id };
    }
    async payerDepuisCaisse(id, user, data) {
        const depense = await this.findOne(id, user);
        if (depense.statut === 'PAYEE') {
            throw new common_1.BadRequestException('Cette dépense est déjà payée.');
        }
        if (depense.statut !== 'APPROUVEE') {
            throw new common_1.BadRequestException('La dépense doit être approuvée avant paiement.');
        }
        const caisse = await this.prisma.caisse.findUnique({ where: { id: data.caisseId } });
        if (!caisse)
            throw new common_1.NotFoundException('Caisse non trouvée');
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, caisse.annexeId, "cette caisse");
        if (caisse.statut === 'FERMEE') {
            throw new common_1.BadRequestException('Cette caisse est fermée aux opérations.');
        }
        if (!(depense.montant > 0)) {
            throw new common_1.BadRequestException('Le montant de la dépense est invalide.');
        }
        return this.prisma.$transaction(async (tx) => {
            const claimed = await tx.depense.updateMany({
                where: { id, statut: 'APPROUVEE' },
                data: { statut: 'PAYEE' },
            });
            if (claimed.count === 0) {
                throw new common_1.BadRequestException('Cette dépense vient d’être payée par ailleurs.');
            }
            await tx.transactionCaisse.create({
                data: {
                    caisseId: data.caisseId,
                    type: 'SORTIE',
                    montant: depense.montant,
                    motif: data.motif || `Paiement dépense ${depense.numero}`,
                    depenseId: depense.id,
                    effectueParId: user.id,
                },
            });
            const updatedCaisse = await tx.caisse.update({
                where: { id: data.caisseId },
                data: { soldeActuel: { decrement: depense.montant } },
            });
            if (updatedCaisse.soldeActuel < 0) {
                throw new common_1.BadRequestException('Solde de caisse insuffisant');
            }
            return tx.depense.findUnique({ where: { id }, include: { annexe: true, fournisseur: true } });
        });
    }
};
exports.DepensesService = DepensesService;
exports.DepensesService = DepensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepensesService);
//# sourceMappingURL=depenses.service.js.map