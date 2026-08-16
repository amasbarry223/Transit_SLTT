import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComptaTab, ViewKey } from "@/lib/nav-store";
import { mapErrorToUserMessage } from "@/shared/utils/error-messages";
import { USER_AVATAR_GRADIENT } from "@/shared/constants";

export { USER_AVATAR_GRADIENT };

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Génère les initiales d'un nom complet (max 2 caractères). */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Détermine si un item de navigation est actif pour la vue courante. */
export function isNavActive(
  currentView: ViewKey,
  itemKey: ViewKey,
  currentComptaTab?: ComptaTab,
  itemComptaTab?: ComptaTab,
): boolean {
  if (itemKey === "dossiers" && (currentView === "dossier-form" || currentView === "dossier-detail")) {
    return true;
  }
  if (itemKey === "clients" && currentView === "client-fiche") return true;
  if (itemKey === "comptabilite" && currentView === "comptabilite") {
    if (itemComptaTab) return currentComptaTab === itemComptaTab;
    return true;
  }
  return currentView === itemKey;
}

/** Message d'erreur affichable depuis une valeur `catch` non typée. */
export function getErrorMessage(
  e: unknown,
  fallback = "Quelque chose s'est mal passé de notre côté. Réessayez dans quelques instants.",
): string {
  return mapErrorToUserMessage(e, fallback);
}
