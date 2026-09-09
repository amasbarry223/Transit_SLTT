"use client";

import { useEffect } from "react";
import { setupCanvasPrintReplacements } from "@/shared/utils/print-canvas";

/**
 * Effets globaux d'impression pour l'ensemble de l'application Transit SLTT :
 * - Remplace automatiquement les canvas (ex. signatures) par des images à l'impression
 * - Précharge le logo de l'entreprise dans le cache navigateur pour un affichage instantané
 * - Optimise les classes du document pendant le cycle d'impression natif
 */
export function PrintGlobalEffects() {
  useEffect(() => {
    // 1. Précharger le logo officiel en tâche de fond
    if (typeof window !== "undefined") {
      const logoImg = new Image();
      logoImg.src = "/logoV.png";
    }

    // 2. Activer les écouteurs de remplacement Canvas -> Image
    const cleanupCanvas = setupCanvasPrintReplacements();

    // 3. Gestionnaire des événements d'impression natifs
    const onBeforePrint = () => {
      document.body.classList.add("is-printing");
    };

    const onAfterPrint = () => {
      document.body.classList.remove("is-printing");
    };

    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);

    return () => {
      cleanupCanvas();
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      document.body.classList.remove("is-printing");
    };
  }, []);

  return null;
}
