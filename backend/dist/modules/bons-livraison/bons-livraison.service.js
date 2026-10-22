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
exports.BonsLivraisonService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const INCLUDE = {
    annexe: { select: { id: true, nom: true, code: true } },
    client: { select: { id: true, nom: true, adresse: true, ville: true, telephone: true } },
    bonSortie: { select: { id: true, reference: true } },
};
let BonsLivraisonService = class BonsLivraisonService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { annexeId: { in: user.annexeIds } };
    }
    assertAnnexeAccess(user, annexeId) {
        if (user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à ce bon de livraison');
        }
    }
    normalizeLignes(lignes, uniteParDefaut, maxQuantite) {
        const normalized = lignes.map((l) => {
            const quantite = Number(l.quantite);
            if (!l.marchandise?.trim())
                throw new common_1.BadRequestException('Chaque ligne doit indiquer une marchandise.');
            if (!Number.isFinite(quantite) || quantite <= 0) {
                throw new common_1.BadRequestException('La quantité de chaque ligne doit être supérieure à 0.');
            }
            return { marchandise: l.marchandise.trim(), quantite, unite: l.unite?.trim() || uniteParDefaut };
        });
        const total = normalized.reduce((acc, l) => acc + l.quantite, 0);
        if (total > maxQuantite + 1e-9) {
            throw new common_1.BadRequestException(`La quantité livrée (${total}) dépasse la quantité du bon de sortie (${maxQuantite}).`);
        }
        return normalized;
    }
    async nextReference() {
        const prefix = `LIV-${new Date().getFullYear()}-`;
        const last = await this.prisma.bonLivraison.findFirst({
            where: { reference: { startsWith: prefix } },
            orderBy: { createdAt: 'desc' },
            select: { reference: true },
        });
        const lastNum = Number(String(last?.reference ?? '').slice(prefix.length)) || 0;
        for (let n = lastNum + 1; n < lastNum + 50; n++) {
            const candidate = `${prefix}${String(n).padStart(4, '0')}`;
            const exists = await this.prisma.bonLivraison.findUnique({ where: { reference: candidate }, select: { id: true } });
            if (!exists)
                return candidate;
        }
        return `${prefix}${Date.now()}`;
    }
    async resolveTransporteur(transporteurId, annexeId) {
        if (!transporteurId)
            return null;
        const t = await this.prisma.transporteur.findUnique({
            where: { id: transporteurId },
            select: { id: true, nom: true, immatriculation: true, annexeId: true },
        });
        if (!t)
            throw new common_1.BadRequestException('Transporteur introuvable.');
        if (t.annexeId && t.annexeId !== annexeId) {
            throw new common_1.BadRequestException("Ce transporteur n'est pas rattaché à l'annexe du bon.");
        }
        return t;
    }
    async findAll(user, params) {
        if (params?.annexeId)
            this.assertAnnexeAccess(user, params.annexeId);
        return this.prisma.bonLivraison.findMany({
            where: {
                ...this.buildAnnexeFilter(user),
                ...(params?.annexeId ? { annexeId: params.annexeId } : {}),
                ...(params?.clientId ? { clientId: params.clientId } : {}),
            },
            include: INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        const bon = (await this.prisma.bonLivraison.findUnique({ where: { id }, include: INCLUDE })) ??
            (await this.prisma.bonLivraison.findFirst({ where: { reference: id }, include: INCLUDE }));
        if (!bon)
            throw new common_1.NotFoundException(`Bon de livraison ${id} non trouvé`);
        this.assertAnnexeAccess(user, bon.annexeId);
        return bon;
    }
    async create(user, data) {
        const bonSortie = await this.prisma.bonSortie.findUnique({
            where: { id: data.bonSortieId },
            include: { client: { select: { nom: true, adresse: true, ville: true } }, bonLivraison: { select: { reference: true } } },
        });
        if (!bonSortie)
            throw new common_1.NotFoundException('Bon de sortie introuvable.');
        this.assertAnnexeAccess(user, bonSortie.annexeId);
        if (bonSortie.statut !== 'Validé') {
            throw new common_1.BadRequestException('Seul un bon de sortie validé peut donner lieu à un bon de livraison.');
        }
        if (bonSortie.bonLivraison) {
            throw new common_1.ConflictException(`Le bon de sortie ${bonSortie.reference} a déjà un bon de livraison (${bonSortie.bonLivraison.reference}).`);
        }
        const lignes = this.normalizeLignes(data.lignes?.length
            ? data.lignes
            : [{ marchandise: bonSortie.marchandise, quantite: bonSortie.quantite, unite: bonSortie.unite }], bonSortie.unite, bonSortie.quantite);
        const transporteur = await this.resolveTransporteur(data.transporteurId, bonSortie.annexeId);
        const adresseClient = [bonSortie.client?.adresse, bonSortie.client?.ville].filter(Boolean).join(', ');
        const buildData = (reference) => ({
            reference,
            date: data.date || new Date().toISOString().slice(0, 10),
            bonSortieId: bonSortie.id,
            clientId: bonSortie.clientId,
            clientNom: bonSortie.clientNom || bonSortie.client?.nom || '',
            annexeId: bonSortie.annexeId,
            lignes: lignes,
            transporteurId: transporteur?.id ?? null,
            transporteurNom: data.transporteurNom?.trim() || transporteur?.nom || null,
            immatriculation: data.immatriculation?.trim() || transporteur?.immatriculation || null,
            chauffeurNom: data.chauffeurNom?.trim() || null,
            chauffeurTelephone: data.chauffeurTelephone?.trim() || null,
            adresseLivraison: data.adresseLivraison?.trim() || adresseClient || null,
            observations: data.observations?.trim() || null,
            statut: 'En cours',
            creePar: user.nom,
        });
        try {
            return await this.prisma.bonLivraison.create({ data: buildData(await this.nextReference()), include: INCLUDE });
        }
        catch (err) {
            if (!(err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002'))
                throw err;
            const target = String(err.meta?.target ?? '');
            if (target.includes('bon_sortie_id') || target.includes('bonSortieId')) {
                throw new common_1.ConflictException(`Le bon de sortie ${bonSortie.reference} a déjà un bon de livraison.`);
            }
            return this.prisma.bonLivraison.create({ data: buildData(await this.nextReference()), include: INCLUDE });
        }
    }
    async update(id, user, data) {
        const bon = await this.findOne(id, user);
        if (bon.statut === 'Livré') {
            throw new common_1.BadRequestException('Un bon de livraison livré ne peut plus être modifié.');
        }
        let lignes;
        if (data.lignes?.length) {
            const bonSortie = await this.prisma.bonSortie.findUnique({
                where: { id: bon.bonSortieId },
                select: { quantite: true, unite: true },
            });
            lignes = this.normalizeLignes(data.lignes, bonSortie?.unite ?? 'colis', bonSortie?.quantite ?? 0);
        }
        const transporteur = data.transporteurId !== undefined ? await this.resolveTransporteur(data.transporteurId || undefined, bon.annexeId) : undefined;
        const str = (v) => (v === undefined ? undefined : v.trim() || null);
        const updated = await this.prisma.bonLivraison.updateMany({
            where: { id: bon.id, statut: { not: 'Livré' } },
            data: {
                ...(data.date !== undefined ? { date: data.date } : {}),
                ...(lignes ? { lignes: lignes } : {}),
                ...(transporteur !== undefined
                    ? {
                        transporteurId: transporteur?.id ?? null,
                        transporteurNom: str(data.transporteurNom) ?? transporteur?.nom ?? null,
                        immatriculation: str(data.immatriculation) ?? transporteur?.immatriculation ?? null,
                    }
                    : {
                        ...(data.transporteurNom !== undefined ? { transporteurNom: str(data.transporteurNom) } : {}),
                        ...(data.immatriculation !== undefined ? { immatriculation: str(data.immatriculation) } : {}),
                    }),
                ...(data.chauffeurNom !== undefined ? { chauffeurNom: str(data.chauffeurNom) } : {}),
                ...(data.chauffeurTelephone !== undefined ? { chauffeurTelephone: str(data.chauffeurTelephone) } : {}),
                ...(data.adresseLivraison !== undefined ? { adresseLivraison: str(data.adresseLivraison) } : {}),
                ...(data.observations !== undefined ? { observations: str(data.observations) } : {}),
                ...(data.statut !== undefined ? { statut: data.statut } : {}),
            },
        });
        if (updated.count === 0) {
            throw new common_1.BadRequestException('Un bon de livraison livré ne peut plus être modifié.');
        }
        return this.prisma.bonLivraison.findUnique({ where: { id: bon.id }, include: INCLUDE });
    }
    async remove(id, user) {
        const bon = await this.findOne(id, user);
        const deleted = await this.prisma.bonLivraison.deleteMany({ where: { id: bon.id, statut: { not: 'Livré' } } });
        if (deleted.count === 0) {
            throw new common_1.BadRequestException('Un bon de livraison livré ne peut pas être supprimé.');
        }
        return { id: bon.id };
    }
};
exports.BonsLivraisonService = BonsLivraisonService;
exports.BonsLivraisonService = BonsLivraisonService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BonsLivraisonService);
//# sourceMappingURL=bons-livraison.service.js.map