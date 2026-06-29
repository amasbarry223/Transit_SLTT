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

/** Retourne true si le rôle courant correspond à l'un des rôles fournis. */
export function useHasRole(...roles: UserRole[]): boolean {
  const currentRole = useNav((s) => s.currentRole);
  return (roles as string[]).includes(currentRole);
}

/** Retourne l'objet User de l'utilisateur connecté, ou null. */
export function useCurrentUser() {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === currentUserId) ?? null;
}
