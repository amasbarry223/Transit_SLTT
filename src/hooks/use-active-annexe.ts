"use client";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-permission";
import type { Annexe } from "@/lib/domain-types";

export interface ActiveAnnexe {
  /** Annexes accessibles à l'utilisateur connecté (member of user_annexes). */
  annexes: Annexe[];
  /** Annexe sous laquelle créer un nouvel enregistrement — jamais un filtre de lecture (la RLS s'en charge déjà). */
  activeAnnexeId: string | null;
  /** Plus d'une annexe assignée : affiche le sélecteur + le reporting consolidé. */
  isMultiAnnexe: boolean;
  setActiveAnnexeId: (id: string) => void;
}

/**
 * Résout l'annexe active de l'utilisateur connecté — auto-sélectionnée s'il
 * est mono-annexe, sinon reprise du choix persisté (nav-store) s'il reste
 * valide pour lui, avec repli sur sa première annexe assignée.
 */
export function useActiveAnnexe(): ActiveAnnexe {
  const allAnnexes = useStore((s) => s.annexes);
  const user = useCurrentUser();
  const selectedAnnexeId = useNav((s) => s.selectedAnnexeId);
  const setSelectedAnnexeId = useNav((s) => s.setSelectedAnnexeId);

  const userAnnexeIds = user?.annexeIds ?? [];
  const annexes = allAnnexes.filter((a) => userAnnexeIds.includes(a.id));

  const activeAnnexeId =
    (selectedAnnexeId && userAnnexeIds.includes(selectedAnnexeId) ? selectedAnnexeId : null) ??
    userAnnexeIds[0] ??
    null;

  return {
    annexes,
    activeAnnexeId,
    isMultiAnnexe: userAnnexeIds.length > 1,
    setActiveAnnexeId: setSelectedAnnexeId,
  };
}
