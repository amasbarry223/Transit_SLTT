/**
 * Logique miroir des RPC `record_facture_paiement` / clamps stock —
 * utilisée pour tests de concurrence / invariants sans DB.
 */

export function applyFacturePaiement(args: {
  statut: string;
  montantTtc: number;
  montantPaye: number;
  paiement: number;
}): { ok: true; montantPaye: number; statut: string } | { ok: false; reason: string } {
  const { statut, montantTtc, montantPaye, paiement } = args;
  if (paiement <= 0) return { ok: false, reason: "Montant de paiement invalide" };
  if (statut === "Brouillon" || statut === "Annulée" || statut === "Soldée") {
    return { ok: false, reason: `Impossible d'enregistrer un paiement sur une facture ${statut}` };
  }
  const reste = Math.max(0, montantTtc - montantPaye);
  if (paiement > reste) {
    return { ok: false, reason: "Montant supérieur au reste à payer" };
  }
  const nextPaye = Math.min(montantTtc, montantPaye + paiement);
  return {
    ok: true,
    montantPaye: nextPaye,
    statut: nextPaye >= montantTtc ? "Soldée" : "Partielle",
  };
}

/** Deux paiements séquentiels sous verrou (FOR UPDATE) ne dépassent jamais le TTC. */
export function simulateSequentialPaiements(
  initial: { statut: string; montantTtc: number; montantPaye: number },
  paiements: number[],
): { montantPaye: number; statut: string; rejected: number } {
  let state = { ...initial };
  let rejected = 0;
  for (const p of paiements) {
    const res = applyFacturePaiement({ ...state, paiement: p });
    if (!res.ok) {
      rejected += 1;
      continue;
    }
    state = { statut: res.statut, montantTtc: state.montantTtc, montantPaye: res.montantPaye };
  }
  return { montantPaye: state.montantPaye, statut: state.statut, rejected };
}

export function canDecrementStock(quantite: number, sortie: number): boolean {
  return sortie > 0 && quantite >= sortie;
}
