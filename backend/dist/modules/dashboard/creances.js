"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculerCreances = calculerCreances;
const facturesActives = (f) => f.statut !== 'ANNULEE' && f.statut !== 'BROUILLON';
const JOUR_MS = 24 * 60 * 60 * 1000;
function calculerCreances(dossiers, factures, now) {
    const aging = {
        '0-30j': { montant: 0, count: 0 },
        '31-60j': { montant: 0, count: 0 },
        '61-90j': { montant: 0, count: 0 },
        '+90j': { montant: 0, count: 0 },
    };
    const echeanceDossier = new Map();
    for (const f of factures) {
        if (!f.dossierId || !facturesActives(f) || !f.dateEcheance)
            continue;
        const e = new Date(f.dateEcheance);
        const prev = echeanceDossier.get(f.dossierId);
        if (!prev || e > prev)
            echeanceDossier.set(f.dossierId, e);
    }
    const items = [];
    for (const d of dossiers) {
        const reste = Math.max(0, Math.round(Number(d.totalContrat || 0) - Number(d.montantPaye || 0)));
        if (reste > 0) {
            items.push({ id: d.id, ref: d.numero, client: d.client?.nom || 'Client', reste, echeance: echeanceDossier.get(d.id) ?? null });
        }
    }
    for (const f of factures) {
        if (f.dossierId || !facturesActives(f))
            continue;
        const reste = Math.max(0, Number(f.montantTtc || 0) - Number(f.montantPaye || 0));
        if (reste > 0) {
            items.push({ id: f.id, ref: f.numero, client: f.client?.nom || 'Client', reste, echeance: f.dateEcheance ? new Date(f.dateEcheance) : null });
        }
    }
    let totalARecouvrer = 0;
    let montantEchu = 0;
    let montantNonEchu = 0;
    const risques = [];
    for (const it of items) {
        totalARecouvrer += it.reste;
        const joursRetard = it.echeance ? Math.floor((now.getTime() - it.echeance.getTime()) / JOUR_MS) : 0;
        if (joursRetard <= 0) {
            montantNonEchu += it.reste;
            aging['0-30j'].montant += it.reste;
            aging['0-30j'].count += 1;
            continue;
        }
        montantEchu += it.reste;
        const tranche = joursRetard <= 30 ? '0-30j' : joursRetard <= 60 ? '31-60j' : joursRetard <= 90 ? '61-90j' : '+90j';
        aging[tranche].montant += it.reste;
        aging[tranche].count += 1;
        risques.push({
            id: it.id,
            clientNom: it.client,
            referenceDossierOuFacture: it.ref,
            montant: it.reste,
            echeance: it.echeance.toLocaleDateString('fr-FR'),
            statut: joursRetard > 60 ? 'Contentieux' : joursRetard > 15 ? 'En retard' : 'À risque',
            joursRetard,
        });
    }
    risques.sort((a, b) => b.joursRetard - a.joursRetard);
    return { totalARecouvrer, montantEchu, montantNonEchu, aging, topRiskClients: risques.slice(0, 5) };
}
//# sourceMappingURL=creances.js.map