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
exports.DossiersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const annexe_filter_utils_1 = require("../../common/annexe-filter.utils");
const pagination_utils_1 = require("../../common/pagination.utils");
function normalizeVoieTransport(val) {
    if (!val)
        return undefined;
    const upper = String(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (upper.includes('AER'))
        return 'AERIEN';
    if (upper.includes('ROUT') || upper.includes('TERR') || upper.includes('FERR'))
        return 'TERRESTRE';
    if (upper.includes('MAR'))
        return 'MARITIME';
    return 'MARITIME';
}
function normalizeStatutDossier(val) {
    if (!val)
        return undefined;
    const upper = String(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
    if (upper.includes('BROUILLON'))
        return 'BROUILLON';
    if (upper.includes('DEDOUAN'))
        return 'EN_DEDOUANEMENT';
    if (upper.includes('LIVR'))
        return 'LIVRE';
    if (upper.includes('ATTENTE'))
        return 'EN_ATTENTE_LIVRAISON';
    if (upper.includes('SOLDE') || upper.includes('CLOTUR'))
        return 'CLOTURE';
    if (upper.includes('ANNUL'))
        return 'ANNULE';
    if (upper.includes('COURS'))
        return 'EN_COURS';
    return 'EN_COURS';
}
function parseDossierDate(val) {
    if (val === null)
        return null;
    if (!val)
        return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
}
function buildDossierPrismaData(data) {
    const res = {};
    if (data.annexeId !== undefined)
        res.annexeId = data.annexeId;
    if (data.clientId !== undefined)
        res.clientId = data.clientId;
    if (data.numero !== undefined)
        res.numero = data.numero;
    if (data.type !== undefined)
        res.type = data.type;
    const st = normalizeStatutDossier(data.statut);
    if (st !== undefined)
        res.statut = st;
    const vt = normalizeVoieTransport(data.voieTransport ?? data.modeTransport);
    if (vt !== undefined)
        res.voieTransport = vt;
    const march = data.marchandise ?? data.nature;
    if (march !== undefined)
        res.marchandise = march;
    const p = data.poids ?? data.poidsTotal;
    if (p !== undefined)
        res.poids = p !== null && p !== '' ? Number(p) : null;
    if (data.volume !== undefined)
        res.volume = data.volume !== null && data.volume !== '' ? Number(data.volume) : null;
    if (data.nombreColis !== undefined) {
        res.nombreColis = data.nombreColis !== null && data.nombreColis !== '' ? parseInt(data.nombreColis, 10) : null;
    }
    const nv = data.navireVol ?? data.camion;
    if (nv !== undefined)
        res.navireVol = nv || null;
    if (data.compagnie !== undefined)
        res.compagnie = data.compagnie || null;
    const bl = data.numeroBl ?? data.bl;
    if (bl !== undefined)
        res.numeroBl = bl || null;
    if (data.portProvenance !== undefined)
        res.portProvenance = data.portProvenance || null;
    const pDest = data.portDestination ?? data.portEntree;
    if (pDest !== undefined)
        res.portDestination = pDest || null;
    const dDepart = parseDossierDate(data.dateDepart ?? data.date);
    if (dDepart !== undefined)
        res.dateDepart = dDepart;
    const dArrPrev = parseDossierDate(data.dateArriveePrevue ?? data.dateEcheance);
    if (dArrPrev !== undefined)
        res.dateArriveePrevue = dArrPrev;
    const dArrEff = parseDossierDate(data.dateArriveeEffective ?? data.dateDedouanement);
    if (dArrEff !== undefined)
        res.dateArriveeEffective = dArrEff;
    const dLiv = parseDossierDate(data.dateLivraison);
    if (dLiv !== undefined)
        res.dateLivraison = dLiv;
    if (data.bureauDouane !== undefined)
        res.bureauDouane = data.bureauDouane || null;
    if (data.numeroDeclaration !== undefined)
        res.numeroDeclaration = data.numeroDeclaration || null;
    const dDecl = parseDossierDate(data.dateDeclaration);
    if (dDecl !== undefined)
        res.dateDeclaration = dDecl;
    const vd = data.valeurDouane ?? data.droitDouane;
    if (vd !== undefined)
        res.valeurDouane = vd !== null && vd !== '' ? Number(vd) : null;
    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    if (data.fraisCircuit !== undefined)
        res.fraisCircuit = num(data.fraisCircuit);
    if (data.fraisPrestation !== undefined)
        res.fraisPrestation = num(data.fraisPrestation);
    if (data.montantInvesti !== undefined)
        res.montantInvesti = num(data.montantInvesti);
    if (data.notes !== undefined)
        res.notes = data.notes || null;
    return res;
}
let DossiersService = class DossiersService {
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
            ...(query.type ? { type: query.type } : {}),
            ...(query.search
                ? {
                    OR: [
                        { numero: { contains: query.search } },
                        { numeroBl: { contains: query.search } },
                        { client: { nom: { contains: query.search } } },
                        { numeroDeclaration: { contains: query.search } },
                    ],
                }
                : {}),
        };
        const [total, data] = await Promise.all([
            this.prisma.dossier.count({ where }),
            this.prisma.dossier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: { select: { id: true, nom: true, code: true } },
                    annexe: { select: { id: true, nom: true, code: true } },
                    conteneurs: true,
                    _count: { select: { documents: true, factures: true, depenses: true } },
                },
            }),
        ]);
        return (0, pagination_utils_1.buildPaginatedResponse)(data, total, { page, limit });
    }
    async findOne(id, user) {
        const dossier = await this.prisma.dossier.findUnique({
            where: { id },
            include: {
                client: true,
                annexe: true,
                conteneurs: true,
                etapes: { orderBy: { ordre: 'asc' } },
                documents: true,
                factures: { include: { lignes: true } },
                depenses: true,
                trackingPublic: true,
                creePar: { select: { id: true, nom: true, email: true } },
            },
        });
        if (!dossier)
            throw new common_1.NotFoundException(`Dossier ${id} non trouvé`);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, dossier.annexeId, 'ce dossier');
        return dossier;
    }
    async create(user, data) {
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, data.annexeId, 'cette annexe');
        if (data.numero && typeof data.numero === 'string') {
            const existing = await this.prisma.dossier.findUnique({ where: { numero: data.numero } });
            if (existing)
                throw new common_1.ConflictException(`Le numéro de dossier ${data.numero} existe déjà`);
        }
        const prismaData = buildDossierPrismaData(data);
        const conteneurs = data.conteneurs ?? (data.noConteneur ? [{ numero: data.noConteneur, type: '40_PIEDS', plomb: '', statut: 'EN_TRANSIT' }] : undefined);
        return this.prisma.$transaction(async (tx) => {
            const dossier = await tx.dossier.create({
                data: {
                    ...prismaData,
                    numero: data.numero ?? `DOS-${Date.now()}`,
                    annexeId: data.annexeId,
                    clientId: data.clientId,
                    statut: prismaData.statut ?? 'EN_COURS',
                    montantPaye: data.montantPaye !== undefined && Number.isFinite(Number(data.montantPaye))
                        ? Number(data.montantPaye)
                        : 0,
                    dateSolde: Number(data.montantPaye) > 0
                        ? parseDossierDate(data.dateSolde ?? data.date ?? data.dateDepart) ?? new Date()
                        : null,
                    creeParId: user.id,
                    conteneurs: conteneurs?.length
                        ? {
                            create: conteneurs.map((c) => ({
                                numero: c.numero,
                                type: c.type || '40_PIEDS',
                                plomb: c.plomb,
                                statut: c.statut || 'EN_TRANSIT',
                            })),
                        }
                        : undefined,
                },
            });
            const codeTracking = `TRK-${dossier.numero}`;
            await tx.trackingPublic.create({
                data: {
                    dossierId: dossier.id,
                    codeTracking,
                    statutAffiche: dossier.statut,
                },
            });
            const etapesDefaut = [
                { titre: 'Ouverture du dossier', ordre: 1, completee: true, dateEffective: new Date() },
                { titre: 'Réception des documents', ordre: 2, completee: false },
                { titre: 'Déclaration en douane', ordre: 3, completee: false },
                { titre: 'Visite douanière & Liquidation', ordre: 4, completee: false },
                { titre: 'Paiement des droits de douane', ordre: 5, completee: false },
                { titre: 'Bon à enlever (BAE)', ordre: 6, completee: false },
                { titre: 'Livraison client', ordre: 7, completee: false },
            ];
            await tx.etapeDossier.createMany({
                data: etapesDefaut.map((e) => ({ ...e, dossierId: dossier.id })),
            });
            return dossier;
        });
    }
    async update(id, user, data) {
        const existing = await this.findOne(id, user);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, data.annexeId, 'cette annexe');
        const updateData = buildDossierPrismaData(data);
        const conteneurs = data.conteneurs ?? (data.noConteneur ? [{ numero: data.noConteneur }] : undefined);
        if (conteneurs?.length) {
            for (const c of conteneurs) {
                if (!c.numero)
                    continue;
                const existingConteneur = existing.conteneurs?.find((ex) => ex.numero === c.numero);
                if (!existingConteneur) {
                    await this.prisma.conteneur.create({
                        data: {
                            dossierId: id,
                            numero: c.numero,
                            type: c.type || '40_PIEDS',
                            plomb: c.plomb,
                            statut: c.statut || 'EN_TRANSIT',
                        },
                    });
                }
            }
        }
        return this.prisma.dossier.update({
            where: { id },
            data: updateData,
            include: { conteneurs: true, client: true, annexe: true },
        });
    }
    async updateStatut(id, user, statut) {
        await this.findOne(id, user);
        const normalized = normalizeStatutDossier(statut);
        const updated = await this.prisma.dossier.update({
            where: { id },
            data: { statut: normalized },
            include: { client: true, annexe: true },
        });
        await this.prisma.trackingPublic
            .updateMany({
            where: { dossierId: id },
            data: { statutAffiche: normalized },
        })
            .catch(() => null);
        return updated;
    }
    async enregistrerPaiement(id, user, data) {
        const dossier = await this.findOne(id, user);
        const montant = Number(data.montant);
        if (!Number.isFinite(montant) || montant <= 0) {
            throw new common_1.BadRequestException('Le montant du règlement doit être supérieur à 0.');
        }
        const plafond = dossier.montantInvesti || 0;
        if (plafond > 0) {
            const reste = plafond - dossier.montantPaye;
            if (montant > reste + 0.5) {
                throw new common_1.BadRequestException(`Le montant dépasse le reste dû (${reste.toLocaleString('fr-FR')}).`);
            }
        }
        const datePaiement = data.date ? new Date(data.date) : new Date();
        return this.prisma.$transaction(async (tx) => {
            await tx.dossier.update({
                where: { id },
                data: {
                    montantPaye: { increment: montant },
                    dateSolde: Number.isNaN(datePaiement.getTime()) ? new Date() : datePaiement,
                },
            });
            if (data.statut) {
                const normalized = normalizeStatutDossier(data.statut) || dossier.statut;
                await tx.dossier.update({ where: { id }, data: { statut: normalized } });
                await tx.trackingPublic.updateMany({
                    where: { dossierId: id },
                    data: { statutAffiche: normalized },
                });
            }
            return tx.dossier.findUnique({ where: { id }, include: { client: true, annexe: true } });
        });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        return this.prisma.$transaction(async (tx) => {
            await tx.facture.updateMany({ where: { dossierId: id }, data: { dossierId: null } });
            await tx.depense.updateMany({ where: { dossierId: id }, data: { dossierId: null } });
            await tx.devis.updateMany({ where: { dossierId: id }, data: { dossierId: null } });
            await tx.dossier.delete({ where: { id } });
            return { id };
        });
    }
};
exports.DossiersService = DossiersService;
exports.DossiersService = DossiersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DossiersService);
//# sourceMappingURL=dossiers.service.js.map