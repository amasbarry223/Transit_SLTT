import { useNav } from "@/lib/nav-store";

/** Nom de l'utilisateur connecté, tel qu'exposé par nav-store (session/auth). */
export function getConnectedUserName(): string {
  return useNav.getState().currentUserName || "Système";
}

/**
 * Annexe active de l'utilisateur connecté, pour les slices Zustand qui n'ont
 * pas accès aux hooks React (ex. conversion devis → dossier). Même logique
 * de repli que useActiveAnnexe() (hooks/use-active-annexe.ts) : choix
 * persisté s'il reste valide, sinon première annexe assignée.
 */
export function resolveActiveAnnexeId(userAnnexeIds: string[]): string | null {
  const selected = useNav.getState().selectedAnnexeId;
  if (selected && userAnnexeIds.includes(selected)) return selected;
  return userAnnexeIds[0] ?? null;
}
