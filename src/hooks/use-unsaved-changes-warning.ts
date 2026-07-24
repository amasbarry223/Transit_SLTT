"use client";

import { useEffect } from "react";

/**
 * Avertit le navigateur (fermeture d'onglet, rechargement) quand des
 * modifications non enregistrées sont en cours — les gardes existantes ne
 * couvrent que la navigation interne (boutons Annuler/Retour), pas la sortie
 * du navigateur lui-même.
 */
export function useUnsavedChangesWarning(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [active]);
}
