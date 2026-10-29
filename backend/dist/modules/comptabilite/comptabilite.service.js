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
exports.ComptabiliteService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const journal_posting_1 = require("./journal-posting");
let ComptabiliteService = class ComptabiliteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildAnnexeFilter(user) {
        if (user.role === 'ADMIN')
            return {};
        return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
    }
    async assertPeriodeOuverte(annexeId, date) {
        if (!annexeId)
            return;
        const cloture = await this.prisma.clotureCaisse.findFirst({
            where: { annexeId, periodeFin: { gte: date } },
            select: { periodeFin: true },
            orderBy: { periodeFin: 'desc' },
        });
        if (cloture) {
            throw new common_1.ConflictException(`La période est clôturée jusqu'au ${cloture.periodeFin} : aucune opération ne peut être ajoutée ou supprimée à cette date.`);
        }
    }
    async findAllOperations(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
            AND: [
                this.buildAnnexeFilter(user),
                params?.annexeId ? { annexeId: params.annexeId } : {},
                params?.clientId ? { clientId: params.clientId } : {},
            ],
        };
        return this.prisma.operationComptable.findMany({
            where,
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
                lien: { select: { origineType: true, origineId: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async nextOperationReference() {
        const last = await this.prisma.operationComptable.findFirst({
            where: { reference: { startsWith: 'OPC-' } },
            orderBy: { createdAt: 'desc' },
            select: { reference: true },
        });
        const lastNum = Number(String(last?.reference ?? '').replace(/^OPC-/, '')) || 0;
        for (let n = lastNum + 1; n < lastNum + 50; n++) {
            const candidate = `OPC-${n}`;
            const exists = await this.prisma.operationComptable.findUnique({
                where: { reference: candidate },
                select: { id: true },
            });
            if (!exists)
                return candidate;
        }
        return `OPC-${Date.now()}`;
    }
    async createOperation(user, data) {
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException("Vous ne pouvez pas créer d'opération pour cette annexe");
        }
        const montant = Number(data.montant);
        if (!Number.isFinite(montant) || montant <= 0) {
            throw new common_1.BadRequestException("Le montant de l'opération doit être supérieur à 0.");
        }
        if (data.type !== 'Entrée' && data.type !== 'Sortie') {
            throw new common_1.BadRequestException("Le type doit être « Entrée » ou « Sortie ».");
        }
        const date = String(data.date || new Date().toISOString()).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new common_1.BadRequestException("La date de l'opération doit être au format AAAA-MM-JJ.");
        }
        await this.assertPeriodeOuverte(data.annexeId, date);
        const reference = data.reference &&
            !(await this.prisma.operationComptable.findUnique({
                where: { reference: data.reference },
                select: { id: true },
            }))
            ? data.reference
            : await this.nextOperationReference();
        const buildData = (ref) => ({
            reference: ref,
            annexeId: data.annexeId || null,
            date,
            clientId: data.clientId || null,
            dossierId: data.dossierId || null,
            clientNom: data.clientNom || null,
            nature: data.nature,
            type: data.type,
            montant,
            modePaiement: data.modePaiement || 'Espèces',
            source: data.source || 'saisie',
            importRef: data.importRef || null,
            creePar: user.nom,
        });
        try {
            return await this.prisma.operationComptable.create({
                data: buildData(reference),
                include: { annexe: true },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                const retryReference = await this.nextOperationReference();
                return this.prisma.operationComptable.create({
                    data: buildData(retryReference),
                    include: { annexe: true },
                });
            }
            throw err;
        }
    }
    async annulerOperation(id, user) {
        const existing = await this.prisma.operationComptable.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Opération ${id} non trouvée`);
        if (existing.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette opération');
        }
        if (existing.source === journal_posting_1.SOURCE_AUTO.CONTREPASSATION) {
            throw new common_1.ConflictException("Une contre-passation ne s'annule pas : saisissez une nouvelle opération si besoin.");
        }
        const auto = typeof existing.source === 'string' && existing.source.startsWith('auto_');
        if (auto && !(existing.source === 'auto_dossier' && !existing.dossierId)) {
            throw new common_1.ConflictException("Cette écriture est générée automatiquement : modifiez le règlement, la dépense ou la facture à l'origine.");
        }
        try {
            return await this.prisma.$transaction(async (tx) => {
                const dejaAnnulee = await tx.journalLien.findUnique({
                    where: { origineType_origineId: { origineType: journal_posting_1.ORIGINE.CONTREPASSATION, origineId: id } },
                    select: { id: true },
                });
                if (dejaAnnulee)
                    throw new common_1.ConflictException('Cette opération a déjà été annulée.');
                const today = new Date().toISOString().slice(0, 10);
                const fin = await (0, journal_posting_1.derniereClotureFin)(tx, existing.annexeId);
                const date = fin && today <= fin ? (0, journal_posting_1.lendemain)(fin) : today;
                const inverse = await tx.operationComptable.create({
                    data: {
                        reference: await (0, journal_posting_1.nextReference)(tx),
                        annexeId: existing.annexeId,
                        date,
                        clientId: existing.clientId,
                        dossierId: existing.dossierId,
                        clientNom: existing.clientNom,
                        nature: `Annulation ${existing.reference} — ${existing.nature}`,
                        type: existing.type === 'Entrée' ? 'Sortie' : 'Entrée',
                        montant: existing.montant,
                        modePaiement: existing.modePaiement,
                        source: journal_posting_1.SOURCE_AUTO.CONTREPASSATION,
                        creePar: user.nom,
                    },
                });
                await tx.journalLien.create({
                    data: { origineType: journal_posting_1.ORIGINE.CONTREPASSATION, origineId: id, operationId: inverse.id },
                });
                return { ...inverse, lien: { origineType: journal_posting_1.ORIGINE.CONTREPASSATION, origineId: id } };
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new common_1.ConflictException('Cette opération a déjà été annulée.');
            }
            throw err;
        }
    }
    async rattacherOperations(user, liens) {
        if (!Array.isArray(liens) || liens.length === 0) {
            throw new common_1.BadRequestException('Aucun rattachement fourni.');
        }
        if (liens.length > 1000) {
            throw new common_1.BadRequestException('1 000 rattachements maximum par envoi.');
        }
        const clientIds = [...new Set(liens.map((l) => l.clientId))];
        const clients = await this.prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true } });
        const clientsConnus = new Set(clients.map((c) => c.id));
        const operations = await this.prisma.operationComptable.findMany({
            where: { id: { in: liens.map((l) => l.operationId) } },
            select: { id: true, annexeId: true },
        });
        const annexeParOp = new Map(operations.map((o) => [o.id, o.annexeId]));
        const parClient = new Map();
        for (const { operationId, clientId } of liens) {
            if (!annexeParOp.has(operationId) || !clientsConnus.has(clientId))
                continue;
            const annexeId = annexeParOp.get(operationId);
            if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId))
                continue;
            parClient.set(clientId, [...(parClient.get(clientId) ?? []), operationId]);
        }
        let rattachees = 0;
        if (parClient.size === 0)
            return { rattachees };
        await this.prisma.$transaction(async (tx) => {
            for (const [clientId, ids] of parClient) {
                const res = await tx.operationComptable.updateMany({
                    where: { id: { in: ids }, clientId: null },
                    data: { clientId },
                });
                rattachees += res.count;
            }
        });
        return { rattachees };
    }
    async findAllClotures(user, params) {
        if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
            throw new common_1.ForbiddenException('Accès non autorisé à cette annexe');
        }
        const where = {
            AND: [
                this.buildAnnexeFilter(user),
                params?.annexeId ? { annexeId: params.annexeId } : {},
            ],
        };
        return this.prisma.clotureCaisse.findMany({
            where,
            include: {
                annexe: { select: { id: true, nom: true, code: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createCloture(user, data) {
        if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas créer de clôture pour cette annexe');
        }
        const soldeConstate = Number(data.soldeConstate);
        if (!Number.isFinite(soldeConstate)) {
            throw new common_1.BadRequestException('Le solde constaté est obligatoire.');
        }
        if (!data.periodeDebut || !data.periodeFin) {
            throw new common_1.BadRequestException('La période de clôture (début et fin) est obligatoire.');
        }
        const iso = /^\d{4}-\d{2}-\d{2}/;
        if (iso.test(data.periodeDebut) && iso.test(data.periodeFin) && data.periodeDebut > data.periodeFin) {
            throw new common_1.BadRequestException('La date de début de période est postérieure à la date de fin.');
        }
        const annexeId = data.annexeId || null;
        const dejaCloturee = await this.prisma.clotureCaisse.findFirst({
            where: {
                annexeId,
                periodeDebut: { lte: data.periodeFin },
                periodeFin: { gte: data.periodeDebut },
            },
            select: { id: true },
        });
        if (dejaCloturee) {
            throw new common_1.ConflictException('Cette période a déjà été clôturée (ou chevauche une clôture existante) pour cette annexe.');
        }
        const precedente = await this.prisma.clotureCaisse.findFirst({
            where: { annexeId, periodeFin: { lt: data.periodeDebut } },
            orderBy: { periodeFin: 'desc' },
            select: { soldeConstate: true },
        });
        const soldeOuverture = precedente?.soldeConstate ?? 0;
        const groupes = await this.prisma.operationComptable.groupBy({
            by: ['type'],
            where: { annexeId, date: { gte: data.periodeDebut, lte: data.periodeFin } },
            _sum: { montant: true },
        });
        const somme = (type) => groupes.find((g) => g.type === type)?._sum?.montant ?? 0;
        const soldeTheorique = Math.round((soldeOuverture + somme('Entrée') - somme('Sortie')) * 100) / 100;
        const ecart = Math.round((soldeConstate - soldeTheorique) * 100) / 100;
        try {
            return await this.prisma.clotureCaisse.create({
                data: {
                    annexeId,
                    periodeDebut: data.periodeDebut,
                    periodeFin: data.periodeFin,
                    soldeTheorique,
                    soldeConstate,
                    ecart,
                    note: data.note || null,
                    cloturePar: user.nom,
                    clotureLe: data.clotureLe || new Date().toISOString(),
                },
                include: { annexe: true },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new common_1.ConflictException('Cette période a déjà été clôturée (ou chevauche une clôture existante) pour cette annexe.');
            }
            throw err;
        }
    }
};
exports.ComptabiliteService = ComptabiliteService;
exports.ComptabiliteService = ComptabiliteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComptabiliteService);
//# sourceMappingURL=comptabilite.service.js.map