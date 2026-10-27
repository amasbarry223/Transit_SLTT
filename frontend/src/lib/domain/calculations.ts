import { financesDossier, type DossierFinancesSource } from "@/lib/domain/dossier-finances";

/** Bénéfice net d'un dossier = total contrat − Σ dépenses (dossier-finances.ts). */
export function beneficeNet(d: DossierFinancesSource): number {
  return financesDossier(d).beneficeNet;
}

/**
 * Reste générique « assiette − payé », borné à 0 — factures et écritures.
 * Pour un dossier, utiliser `resteDuDossier` (total contrat − paiements).
 */
export function resteAPayer(d: {
  montantInvesti: number;
  montantPaye: number;
}): number {
  return Math.max(0, d.montantInvesti - d.montantPaye);
}
