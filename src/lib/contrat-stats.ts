import type { Contrat, ContratPrestation, Depense } from "@/lib/store";

/** Recalcule les agrégats contrat (compteur de prestations, total dépenses) — F3/F4/F6. */
export function syncContratStats(
  depenses: Depense[],
  prestations: ContratPrestation[],
  contrats: Array<Omit<Contrat, "nbPrestations" | "nbPrestationsRealisees" | "totalDepenses">>,
): Contrat[] {
  return contrats.map((c) => {
    const cPrestations = prestations.filter((p) => p.contratId === c.id);
    const cDepenses = depenses.filter((d) => d.contratId === c.id);
    return {
      ...c,
      nbPrestations: cPrestations.length,
      nbPrestationsRealisees: cPrestations.filter((p) => p.statut === "Réalisée").length,
      totalDepenses: cDepenses.reduce((sum, d) => sum + d.montant, 0),
    };
  });
}
