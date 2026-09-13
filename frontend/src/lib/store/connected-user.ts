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
 * profil s'il reste valide, sinon première annexe assignée.
 */
export function resolveActiveAnnexeId(userAnnexeIds: string[], fallbackAnnexes?: { id: string; estSiege?: boolean }[]): string | null {
  const selected = useUiPrefs.getState().selectedAnnexeId;
  if (selected && userAnnexeIds.includes(selected)) return selected;
  if (userAnnexeIds[0]) return userAnnexeIds[0];

  // Repli gracieux : si l'utilisateur n'a pas encore de liste locale (ex. avant premier rechargement)
  // et qu'une sélection globale ou des annexes existent en mémoire
  if (selected && (!fallbackAnnexes || fallbackAnnexes.some((a) => a.id === selected))) return selected;
  if (fallbackAnnexes && fallbackAnnexes.length > 0) {
    const siege = fallbackAnnexes.find((a) => a.estSiege);
    return siege?.id ?? fallbackAnnexes[0].id;
  }
  return null;
}

/** Comme resolveActiveAnnexeId mais lève une erreur métier si aucune annexe. */
export function requireActiveAnnexeId(userAnnexeIds: string[], fallbackAnnexes?: { id: string; estSiege?: boolean }[]): string {
  const annexeId = resolveActiveAnnexeId(userAnnexeIds, fallbackAnnexes);
  if (!annexeId) {
    throw new Error("Aucune annexe active — assignez une annexe à l'utilisateur.");
  }
  return annexeId;
}
