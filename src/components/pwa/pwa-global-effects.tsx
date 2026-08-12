"use client";

import { PwaUpdatePrompt } from "@/components/pwa/PwaUpdatePrompt";

/** Effets PWA globaux (hors AppShell) — disponibles dès le chargement, y compris sur l'écran de login. */
export function PwaGlobalEffects() {
  return <PwaUpdatePrompt />;
}
