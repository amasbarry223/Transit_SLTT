import { useNav } from "@/lib/nav-store";

/** Nom de l'utilisateur connecté, tel qu'exposé par nav-store (session/auth). */
export function getConnectedUserName(): string {
  return useNav.getState().currentUserName || "Système";
}
