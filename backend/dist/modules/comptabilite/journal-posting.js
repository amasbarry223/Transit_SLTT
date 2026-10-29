"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modePaiementJournal = exports.SOURCE_AUTO = exports.ORIGINE = void 0;
exports.lendemain = lendemain;
exports.getBascule = getBascule;
exports.derniereClotureFin = derniereClotureFin;
exports.nextReference = nextReference;
exports.posterEcriture = posterEcriture;
exports.retirerEcriture = retirerEcriture;
exports.synchroniserJournalDossier = synchroniserJournalDossier;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('JournalPosting');
exports.ORIGINE = {
    DOSSIER_PAIEMENT: 'DOSSIER_PAIEMENT',
    DOSSIER_DEPENSE: 'DOSSIER_DEPENSE',
    FACTURE_PAIEMENT: 'FACTURE_PAIEMENT',
    DEPENSE_PAYEE: 'DEPENSE_PAYEE',
    CONTREPASSATION: 'CONTREPASSATION',
};
exports.SOURCE_AUTO = {
    DOSSIER_PAIEMENT: 'auto_dossier',
    DOSSIER_DEPENSE: 'auto_dossier',
    FACTURE_PAIEMENT: 'auto_facture',
    DEPENSE_PAYEE: 'auto_depense',
    CONTREPASSATION: 'contrepassation',
};
const BASCULE_CLE = 'comptabilite.journal_bascule';
const MODE_JOURNAL = {
    ESPECES: 'Espèces',
    VIREMENT: 'Virement',
    CHEQUE: 'Chèque',
    ORANGE_MONEY: 'Mobile Money',
    WAVE: 'Mobile Money',
};
const modePaiementJournal = (mode) => MODE_JOURNAL[mode ?? ''] ?? 'Espèces';
exports.modePaiementJournal = modePaiementJournal;
const iso = (d) => (typeof d === 'string' ? d : d.toISOString()).slice(0, 10);
function lendemain(dateIso) {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}
async function getBascule(tx) {
    const existing = await tx.setting.findUnique({ where: { cle: BASCULE_CLE } });
    if (existing)
        return new Date(existing.valeur);
    const now = new Date();
    await tx.setting.create({
        data: {
            cle: BASCULE_CLE,
            valeur: now.toISOString(),
            groupName: 'comptabilite',
            description: "Date à partir de laquelle les règlements/dépenses de dossier alimentent automatiquement le journal.",
        },
    });
    return now;
}
async function derniereClotureFin(tx, annexeId) {
    if (!annexeId)
        return null;
    const c = await tx.clotureCaisse.findFirst({
        where: { annexeId },
        orderBy: { periodeFin: 'desc' },
        select: { periodeFin: true },
    });
    return c ? String(c.periodeFin).slice(0, 10) : null;
}
async function nextReference(tx) {
    const last = await tx.operationComptable.findFirst({
        where: { reference: { startsWith: 'OPC-' } },
        orderBy: { createdAt: 'desc' },
        select: { reference: true },
    });
    const lastNum = Number(String(last?.reference ?? '').replace(/^OPC-/, '')) || 0;
    for (let n = lastNum + 1; n < lastNum + 50; n++) {
        const candidate = `OPC-${n}`;
        if (!(await tx.operationComptable.findUnique({ where: { reference: candidate }, select: { id: true } }))) {
            return candidate;
        }
    }
    return `OPC-${Date.now()}`;
}
async function posterEcriture(tx, e) {
    try {
        if (!(e.montant > 0))
            return;
        const lien = await tx.journalLien.findUnique({
            where: { origineType_origineId: { origineType: e.origineType, origineId: e.origineId } },
            include: { operation: true },
        });
        const fin = await derniereClotureFin(tx, e.annexeId);
        const dateEvt = iso(e.date);
        if (lien) {
            if (fin && String(lien.operation.date) <= fin)
                return;
            const date = fin && dateEvt <= fin ? lendemain(fin) : dateEvt;
            await tx.operationComptable.update({
                where: { id: lien.operationId },
                data: { date, montant: e.montant, nature: e.nature, type: e.type, modePaiement: e.modePaiement ?? 'Espèces' },
            });
            return;
        }
        const date = fin && dateEvt <= fin ? lendemain(fin) : dateEvt;
        const nature = date !== dateEvt ? `${e.nature} (du ${dateEvt})` : e.nature;
        const operation = await tx.operationComptable.create({
            data: {
                reference: await nextReference(tx),
                annexeId: e.annexeId,
                date,
                clientId: e.clientId ?? null,
                dossierId: e.dossierId ?? null,
                clientNom: e.clientNom ?? null,
                nature,
                type: e.type,
                montant: e.montant,
                modePaiement: e.modePaiement ?? 'Espèces',
                source: exports.SOURCE_AUTO[e.origineType],
                creePar: 'Automatique',
            },
        });
        await tx.journalLien.create({
            data: { origineType: e.origineType, origineId: e.origineId, operationId: operation.id },
        });
    }
    catch (err) {
        logger.warn(`Écriture automatique ignorée (${e.origineType} ${e.origineId}) : ${err.message}`);
    }
}
async function retirerEcriture(tx, origineType, origineId) {
    try {
        const lien = await tx.journalLien.findUnique({
            where: { origineType_origineId: { origineType, origineId } },
            include: { operation: true },
        });
        if (!lien)
            return;
        const fin = await derniereClotureFin(tx, lien.operation.annexeId);
        if (fin && String(lien.operation.date) <= fin)
            return;
        await tx.operationComptable.delete({ where: { id: lien.operationId } });
    }
    catch (err) {
        logger.warn(`Retrait d'écriture automatique ignoré (${origineType} ${origineId}) : ${err.message}`);
    }
}
async function synchroniserJournalDossier(tx, dossierId) {
    try {
        const bascule = await getBascule(tx);
        const dossier = await tx.dossier.findUnique({
            where: { id: dossierId },
            include: { client: { select: { id: true, nom: true } }, paiements: true, depensesDossier: true },
        });
        if (!dossier)
            return;
        const base = {
            annexeId: dossier.annexeId ?? null,
            clientId: dossier.client?.id ?? dossier.clientId ?? null,
            clientNom: dossier.client?.nom ?? null,
            dossierId,
        };
        const num = (v) => Math.round(Number(v)) || 0;
        const idsPaiements = new Set();
        for (const p of dossier.paiements) {
            if (new Date(p.createdAt) < bascule)
                continue;
            idsPaiements.add(p.id);
            await posterEcriture(tx, {
                ...base,
                origineType: exports.ORIGINE.DOSSIER_PAIEMENT,
                origineId: p.id,
                date: p.date,
                type: 'Entrée',
                montant: num(p.montant),
                nature: `Règlement dossier ${dossier.reference}`,
                modePaiement: (0, exports.modePaiementJournal)(p.mode),
            });
        }
        const idsDepenses = new Set();
        for (const d of dossier.depensesDossier) {
            if (new Date(d.createdAt) < bascule)
                continue;
            idsDepenses.add(d.id);
            await posterEcriture(tx, {
                ...base,
                origineType: exports.ORIGINE.DOSSIER_DEPENSE,
                origineId: d.id,
                date: d.date,
                type: 'Sortie',
                montant: num(d.montant),
                nature: `${d.nature} — dossier ${dossier.reference}`,
            });
        }
        const liens = await tx.journalLien.findMany({
            where: {
                origineType: { in: [exports.ORIGINE.DOSSIER_PAIEMENT, exports.ORIGINE.DOSSIER_DEPENSE] },
                operation: { dossierId },
            },
            select: { origineType: true, origineId: true },
        });
        for (const l of liens) {
            const vivants = l.origineType === exports.ORIGINE.DOSSIER_PAIEMENT ? idsPaiements : idsDepenses;
            if (!vivants.has(l.origineId))
                await retirerEcriture(tx, l.origineType, l.origineId);
        }
    }
    catch (err) {
        logger.warn(`Synchronisation du journal ignorée (dossier ${dossierId}) : ${err.message}`);
    }
}
//# sourceMappingURL=journal-posting.js.map