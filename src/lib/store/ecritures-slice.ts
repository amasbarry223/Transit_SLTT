import type { StateCreator } from "zustand";
import type { Ecriture } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";

/**
 * Écritures (bons de paiement). Pas de modèle backend : `ecritures` est
 * uniquement alimenté en session par le solde d'un dossier
 * (`syncEcritureWhenDossierSolde` dans dossiers-slice). Lecture seule
 * ailleurs (classeur client, bilans).
 */
export interface EcrituresSlice {
  ecritures: Ecriture[];
}

export const createEcrituresSlice: StateCreator<SLTTState, [], [], EcrituresSlice> = () => ({
  ecritures: [],
});
