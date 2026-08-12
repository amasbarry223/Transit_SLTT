/**
 * Reçu de paiement — helpers purs partagés entre le formulaire (aperçu
 * temps réel du reste/statut avant enregistrement) et l'écran liste
 * (filtres). Document autonome, sans lien avec le journal de caisse ni les Écritures.
 */
import type { RecuPaiement, RecuPaiementStatut } from "@/lib/domain-types";

/** Reste = somme − montant payé, jamais négatif (un trop-perçu ne doit pas apparaître comme un reste dû). */
export function computeReste(somme: number, montantPaye: number): number {
  return Math.max(0, somme - montantPaye);
}

/** Même formule que la colonne générée en base (`recus_paiement.statut`) — dupliquée ici pour l'aperçu du formulaire avant enregistrement. */
export function computeStatut(somme: number, montantPaye: number): RecuPaiementStatut {
  if (montantPaye <= 0) return "EN_ATTENTE";
  if (montantPaye >= somme) return "SOLDE";
  return "PARTIEL";
}

export function filterRecusPaiementByQuery(recus: RecuPaiement[], query: string): RecuPaiement[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return recus;
  return recus.filter((r) => {
    const haystack = `${r.nom} ${r.prenom} ${r.reference} ${r.motif}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function filterRecusPaiementByStatut(
  recus: RecuPaiement[],
  statut: RecuPaiementStatut | "all",
): RecuPaiement[] {
  if (statut === "all") return recus;
  return recus.filter((r) => r.statut === statut);
}
