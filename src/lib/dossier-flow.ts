import type { DossierStatut } from "@/lib/domain-types";

/** Flux linéaire des statuts dossier — une seule transition à la fois. */
export const DOSSIER_STATUT_FLOW: Partial<Record<DossierStatut, DossierStatut>> = {
  "En cours": "Dédouané",
  "Dédouané": "Livré",
  "Livré": "Soldé",
};

export function getNextDossierStatut(current: DossierStatut): DossierStatut | null {
  return DOSSIER_STATUT_FLOW[current] ?? null;
}

export function assertDossierTransition(current: DossierStatut, target: DossierStatut): void {
  if (DOSSIER_STATUT_FLOW[current] !== target) {
    throw new Error(
      `Transition invalide : un dossier « ${current} » ne peut passer qu'à « ${DOSSIER_STATUT_FLOW[current] ?? "aucun statut (déjà final)"} ».`,
    );
  }
}
