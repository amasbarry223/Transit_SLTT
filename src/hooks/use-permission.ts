"use client";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { hasPermission, resolvePermissionUser } from "@/lib/permissions";
import type { UserRole } from "@/lib/domain-types";

function useEffectivePermissionUser() {
  const currentUserId = useNav((s) => s.currentUserId);
  const currentRole = useNav((s) => s.currentRole);
  const users = useStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId);
  return resolvePermissionUser(user, currentRole);
}

/** Retourne true si l'utilisateur connecté possède la permission demandée. */
export function usePermission(perm: string): boolean {
  return hasPermission(useEffectivePermissionUser(), perm);
}

export function useCanManageUsers(): boolean {
  return hasPermission(useEffectivePermissionUser(), "utilisateurs:manage");
}

export function useHasRole(...roles: UserRole[]): boolean {
  const currentUserId = useNav((s) => s.currentUserId);
  const currentRole = useNav((s) => s.currentRole);
  const users = useStore((s) => s.users);
  if (!currentUserId && !currentRole) return false;
  const user = users.find((u) => u.id === currentUserId);
  if (user) {
    if (!user.actif) return false;
    return (roles as string[]).includes(user.role);
  }
  return currentRole ? (roles as string[]).includes(currentRole) : false;
}

/** Retourne l'objet User de l'utilisateur connecté, ou null. */
export function useCurrentUser() {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === currentUserId) ?? null;
}
