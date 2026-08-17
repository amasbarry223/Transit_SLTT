"use client";

/** BUG-03: fmtFCFA and fmtDate declared before first use (printDevis) */
export function fmtFCFA(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)) + " FCFA";
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Date compacte "12/01/2026" — pour les colonnes de tableaux denses où le
 * format long ("12 janvier 2026") déborderait ou passerait à la ligne. */
export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Montant sans le suffixe "FCFA" — pour les tableaux où la devise est déjà
 * indiquée une seule fois dans l'en-tête de colonne, pas répétée sur chaque ligne. */
export function fmtFCFAPlain(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
}

/**
 * Source de vérité unique pour "faut-il afficher la ligne TVA ?" (F2 — TVA
 * optionnelle). Réutilisée ici, dans facture-detail.tsx et factures.tsx pour
 * éviter toute divergence entre le PDF, le détail et le formulaire.
 */
export function shouldShowTva(tauxTVA: number): boolean {
  return tauxTVA > 0;
}
