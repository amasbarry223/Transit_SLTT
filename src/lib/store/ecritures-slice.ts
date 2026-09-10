import type { StateCreator } from "zustand";
import type { Ecriture } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";

/**
 * Écritures (bons de paiement) — vestige de l'ère Supabase, sans modèle
 * backend. Depuis que `Dossier.montantPaye` / `dateSolde` persistent, plus
 * rien n'alimente ce tableau : `ecritures` est désormais **toujours vide**.
 * Conservé le temps de retirer les vues qui l'affichent encore (panneau
 * comptable du dashboard, section "Écritures" du détail dossier). Toute
 * agrégation financière doit lire `dossier.montantPaye`, pas `ecritures`.
 */
export interface EcrituresSlice {
  ecritures: Ecriture[];
}

export const createEcrituresSlice: StateCreator<SLTTState, [], [], EcrituresSlice> = () => ({
  ecritures: [],
});
