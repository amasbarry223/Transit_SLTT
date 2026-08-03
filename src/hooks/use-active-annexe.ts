"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";

import { useStore } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-permission";
import type { Annexe } from "@/lib/domain-types";

export interface ActiveAnnexe {
  /** Annexes accessibles à l'utilisateur connecté (member of user_annexes). */
  annexes: Annexe[];
  /** Annexe sous laquelle créer un nouvel enregistrement — jamais null (repli sur la 1ère annexe assignée). */
  activeAnnexeId: string | null;
  /**
   * Choix brut persisté (topbar) : null = "Toutes les annexes". C'est ce
   * qu'il faut passer à `filterByAnnexe` pour filtrer la vue d'un écran —
   * contrairement à `activeAnnexeId`, qui ne sert qu'au contexte de création
   * et ne doit jamais filtrer une liste (la RLS s'en charge déjà).
   */
  selectedAnnexeId: string | null;
  /** Plus d'une annexe assignée : affiche le sélecteur + le reporting consolidé. */
  isMultiAnnexe: boolean;
  setActiveAnnexeId: (id: string | null) => void;
}

/**
 * Résout l'annexe active de l'utilisateur connecté — auto-sélectionnée s'il
 * est mono-annexe, sinon reprise du choix persisté (nav-store) s'il reste
 * valide pour lui, avec repli sur sa première annexe assignée.
 */
export function useActiveAnnexe(): ActiveAnnexe {
  const allAnnexes = useStore((s) => s.annexes);
  const user = useCurrentUser();
  const selectedAnnexeId = useUiPrefs((s) => s.selectedAnnexeId);
  const setSelectedAnnexeId = useUiPrefs((s) => s.setSelectedAnnexeId);

  const userAnnexeIds = user?.annexeIds ?? [];
  const annexes = allAnnexes.filter((a) => userAnnexeIds.includes(a.id));

  const activeAnnexeId =
    (selectedAnnexeId && userAnnexeIds.includes(selectedAnnexeId) ? selectedAnnexeId : null) ??
    userAnnexeIds[0] ??
    null;

  return {
    annexes,
    activeAnnexeId,
    selectedAnnexeId: selectedAnnexeId && userAnnexeIds.includes(selectedAnnexeId) ? selectedAnnexeId : null,
    isMultiAnnexe: userAnnexeIds.length > 1,
    setActiveAnnexeId: setSelectedAnnexeId,
  };
}
