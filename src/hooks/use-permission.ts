"use client";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { UserRole } from "@/lib/mock-data";

/** Retourne true si l'utilisateur connecté possède la permission demandée. L'Administrateur a toutes les permissions. */
export function usePermission(perm: string): boolean {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId);
  if (!user || !user.actif) return false;
  if (user.role === "Administrateur") return true;
  return user.permissions.includes(perm);
}

/**
 * Retourne true si l'utilisateur connecté (vérifié dans store.users) possède l'un des rôles fournis.
 * On re-dérive le rôle depuis store.users pour ne pas faire confiance uniquement au currentRole
 * de nav-store (qui est stocké dans localStorage et potentiellement manipulable).
 * Si currentUserId est null ou si l'utilisateur est introuvable/inactif, retourne false.
 */
export function useHasRole(...roles: UserRole[]): boolean {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  if (!currentUserId) return false;
  const user = users.find((u) => u.id === currentUserId);
  if (!user || !user.actif) return false;
  return (roles as string[]).includes(user.role);
}

/** Retourne l'objet User de l'utilisateur connecté, ou null. */
export function useCurrentUser() {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === currentUserId) ?? null;
}
