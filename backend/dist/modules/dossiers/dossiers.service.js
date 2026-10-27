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
exports.serializeDossier = serializeDossier;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const annexe_filter_utils_1 = require("../../common/annexe-filter.utils");
const pagination_utils_1 = require("../../common/pagination.utils");
const dossier_finances_1 = require("./dossier-finances");
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
    if (upper.includes('ATTENTE'))
        return 'EN_ATTENTE_LIVRAISON';
    if (upper.includes('LIVR'))
        return 'LIVRE';
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
    const contrat = data.totalContrat ?? data.fraisPrestation;
    if (contrat !== undefined)
        res.totalContrat = (0, dossier_finances_1.toFcfa)(contrat);
    if (data.notes !== undefined)
        res.notes = data.notes || null;
    return res;
}
const ORDRE_LIGNES = [{ date: 'asc' }, { createdAt: 'asc' }];
const LIGNES_INCLUDE = {
    depensesDossier: { orderBy: ORDRE_LIGNES },
    paiements: { orderBy: ORDRE_LIGNES },
};
function serializeDossier(d) {
    if (!d)
        return d;
    const depensesDossier = (d.depensesDossier ?? []).map((l) => ({ ...l, montant: (0, dossier_finances_1.toFcfa)(l.montant) }));
    const paiements = (d.paiements ?? []).map((p) => ({ ...p, montant: (0, dossier_finances_1.toFcfa)(p.montant) }));
    return {
        ...d,
        depensesDossier,
        paiements,
        finances: (0, dossier_finances_1.calculerFinancesDossier)({ totalContrat: d.totalContrat, paiements, depenses: depensesDossier }),
    };
}
const parseLigneDate = (v) => parseDossierDate(v) ?? new Date();
async function remplacerLignes(delegate, dossierId, lignes, toData) {
    const existants = await delegate.findMany({ where: { dossierId }, select: { id: true } });
    const idsExistants = new Set(existants.map((e) => e.id));
    const conserves = lignes.filter((l) => l.id && idsExistants.has(l.id)).map((l) => l.id);
    await delegate.deleteMany({ where: { dossierId, id: { notIn: conserves } } });
    for (const l of lignes) {
        if (l.id && idsExistants.has(l.id)) {
            await delegate.updateMany({ where: { id: l.id, dossierId }, data: toData(l) });
        }
        else {
            await delegate.create({ data: { ...toData(l), dossierId } });
        }
    }
}
const depenseData = (l) => ({
    date: parseLigneDate(l.date),
    nature: String(l.nature || '').trim() || 'Dépense',
    categorie: dossier_finances_1.CATEGORIES_DEPENSE.includes(l.categorie) ? l.categorie : 'DIVERS',
    montant: BigInt((0, dossier_finances_1.toFcfa)(l.montant)),
});
const paiementData = (p) => ({
    date: parseLigneDate(p.date),
    montant: BigInt((0, dossier_finances_1.toFcfa)(p.montant)),
    mode: dossier_finances_1.MODES_PAIEMENT.includes(p.mode) ? p.mode : 'ESPECES',
    reference: p.reference ? String(p.reference) : null,
});
async function syncLignesEtTotaux(tx, dossierId, data) {
    if (Array.isArray(data.depensesDossier)) {
        await remplacerLignes(tx.dossierDepense, dossierId, data.depensesDossier, depenseData);
    }
    else {
        const reprises = [
            { nature: 'Droit de douane', categorie: 'DOUANE', montant: (0, dossier_finances_1.toFcfa)(data.droitDouane ?? data.valeurDouane) },
            { nature: 'Frais de circuit (reprise)', categorie: 'DIVERS', montant: (0, dossier_finances_1.toFcfa)(data.fraisCircuit) },
        ].filter((r) => r.montant > 0);
        if (reprises.length && (await tx.dossierDepense.count({ where: { dossierId } })) === 0) {
            for (const r of reprises) {
                await tx.dossierDepense.create({ data: { ...depenseData(r), dossierId } });
            }
        }
    }
    if (Array.isArray(data.paiements)) {
        await remplacerLignes(tx.dossierPaiement, dossierId, data.paiements, paiementData);
    }
    else if ((0, dossier_finances_1.toFcfa)(data.montantPaye) > 0 && (await tx.dossierPaiement.count({ where: { dossierId } })) === 0) {
        await tx.dossierPaiement.create({
            data: {
                ...paiementData({ montant: data.montantPaye, date: data.dateSolde ?? data.date, reference: 'Paiement (reprise)' }),
                dossierId,
            },
        });
    }
    const dossier = await tx.dossier.findUnique({ where: { id: dossierId }, include: LIGNES_INCLUDE });
    const f = (0, dossier_finances_1.calculerFinancesDossier)({
        totalContrat: dossier.totalContrat,
        paiements: dossier.paiements,
        depenses: dossier.depensesDossier,
    });
    const dernierPaiement = dossier.paiements[dossier.paiements.length - 1];
    await tx.dossier.update({
        where: { id: dossierId },
        data: {
            montantPaye: f.montantPaye,
            dateSolde: dernierPaiement ? dernierPaiement.date : null,
        },
    });
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
                    ...LIGNES_INCLUDE,
                    _count: { select: { documents: true, factures: true, depenses: true } },
                },
            }),
        ]);
        return (0, pagination_utils_1.buildPaginatedResponse)(data.map(serializeDossier), total, { page, limit });
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
                ...LIGNES_INCLUDE,
            },
        });
        if (!dossier)
            throw new common_1.NotFoundException(`Dossier ${id} non trouvé`);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, dossier.annexeId, 'ce dossier');
        return serializeDossier(dossier);
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
            await syncLignesEtTotaux(tx, dossier.id, data);
            return serializeDossier(await tx.dossier.findUnique({ where: { id: dossier.id }, include: LIGNES_INCLUDE }));
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
        return this.prisma.$transaction(async (tx) => {
            await tx.dossier.update({ where: { id }, data: updateData });
            await syncLignesEtTotaux(tx, id, data);
            return serializeDossier(await tx.dossier.findUnique({
                where: { id },
                include: { conteneurs: true, client: true, annexe: true, ...LIGNES_INCLUDE },
            }));
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
        const montant = (0, dossier_finances_1.toFcfa)(data.montant);
        if (montant <= 0) {
            throw new common_1.BadRequestException('Le montant du règlement doit être supérieur à 0.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.dossierPaiement.create({
                data: { ...paiementData({ montant, date: data.date, mode: data.mode, reference: data.reference }), dossierId: id },
            });
            await syncLignesEtTotaux(tx, id, {});
            if (data.statut) {
                const normalized = normalizeStatutDossier(data.statut) || dossier.statut;
                await tx.dossier.update({ where: { id }, data: { statut: normalized } });
                await tx.trackingPublic.updateMany({
                    where: { dossierId: id },
                    data: { statutAffiche: normalized },
                });
            }
            return serializeDossier(await tx.dossier.findUnique({ where: { id }, include: { client: true, annexe: true, ...LIGNES_INCLUDE } }));
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