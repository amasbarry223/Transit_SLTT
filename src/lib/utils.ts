import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ViewKey } from "@/lib/nav-store";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Dégradé d'avatar unique pour les utilisateurs (agents, admins…) — dérivé de --primary. */
export const USER_AVATAR_GRADIENT = "bg-gradient-to-br from-primary to-[var(--primary-hover)]";

/** Génère les initiales d'un nom complet (max 2 caractères). */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Détermine si un item de navigation est actif pour la vue courante. */
export function isNavActive(currentView: ViewKey, itemKey: ViewKey): boolean {
  if (itemKey === "dossiers" && (currentView === "dossier-form" || currentView === "dossier-detail")) return true;
  if (itemKey === "clients" && currentView === "client-fiche") return true;
  return currentView === itemKey;
}

/** Message d'erreur affichable depuis une valeur `catch` non typée. */
export function getErrorMessage(e: unknown, fallback = "Une erreur inconnue est survenue"): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e) return e;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return fallback;
}
