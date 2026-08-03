import { useSession } from "@/lib/session/session-store";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";

/** Nom de l'utilisateur connecté, tel qu'exposé par session-store. */
export function getConnectedUserName(): string {
  return useSession.getState().currentUserName || "Système";
}

/**
 * Annexe active de l'utilisateur connecté, pour les slices Zustand qui n'ont
 * pas accès aux hooks React (ex. conversion devis → dossier). Même logique
 * de repli que useActiveAnnexe() (hooks/use-active-annexe.ts) : choix
 * persisté s'il reste valide, sinon première annexe assignée.
 */
export function resolveActiveAnnexeId(userAnnexeIds: string[]): string | null {
  const selected = useUiPrefs.getState().selectedAnnexeId;
  if (selected && userAnnexeIds.includes(selected)) return selected;
  return userAnnexeIds[0] ?? null;
}

/** Comme resolveActiveAnnexeId mais lève une erreur métier si aucune annexe. */
export function requireActiveAnnexeId(userAnnexeIds: string[]): string {
  const annexeId = resolveActiveAnnexeId(userAnnexeIds);
  if (!annexeId) {
    throw new Error("Aucune annexe active — assignez une annexe à l'utilisateur.");
  }
  return annexeId;
}
