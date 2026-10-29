import type { Contrat, ContratPrestation } from "@/lib/store";

/** Recalcule les compteurs de prestations d'un contrat. */
export function syncContratStats(
  prestations: ContratPrestation[],
  contrats: Array<Omit<Contrat, "nbPrestations" | "nbPrestationsRealisees">>,
): Contrat[] {
  return contrats.map((c) => {
    const cPrestations = prestations.filter((p) => p.contratId === c.id);
    return {
      ...c,
      nbPrestations: cPrestations.length,
      nbPrestationsRealisees: cPrestations.filter((p) => p.statut === "Réalisée").length,
    };
  });
}
