"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODES_PAIEMENT = exports.CATEGORIES_DEPENSE = void 0;
exports.toFcfa = toFcfa;
exports.statutPaiement = statutPaiement;
exports.calculerFinancesDossier = calculerFinancesDossier;
exports.CATEGORIES_DEPENSE = [
    'DOUANE',
    'TRANSPORT',
    'MANUTENTION',
    'FRAIS_PORTUAIRES',
    'AVANCE',
    'DIVERS',
];
exports.MODES_PAIEMENT = ['ESPECES', 'VIREMENT', 'CHEQUE', 'ORANGE_MONEY', 'WAVE'];
function toFcfa(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : 0;
}
const somme = (lignes) => (lignes ?? []).reduce((s, l) => s + toFcfa(l.montant), 0);
function statutPaiement(totalContrat, montantPaye) {
    const reste = totalContrat - montantPaye;
    if (reste < 0)
        return 'TROP_PERCU';
    if (reste === 0)
        return 'SOLDE';
    if (montantPaye === 0 && totalContrat > 0)
        return 'IMPAYE';
    return 'PARTIEL';
}
function calculerFinancesDossier(d) {
    const totalContrat = toFcfa(d.totalContrat);
    const montantPaye = somme(d.paiements);
    const totalDepenses = somme(d.depenses);
    const beneficeNet = totalContrat - totalDepenses;
    return {
        totalContrat,
        montantPaye,
        resteAPayer: totalContrat - montantPaye,
        totalDepenses,
        beneficeNet,
        statutPaiement: statutPaiement(totalContrat, montantPaye),
        perte: beneficeNet < 0,
    };
}
//# sourceMappingURL=dossier-finances.js.map