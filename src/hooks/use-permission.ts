"use client";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { hasPermission } from "@/lib/permissions";
import type { UserRole } from "@/lib/domain-types";

/** Retourne true si l'utilisateur connecté possède la permission demandée. */
export function usePermission(perm: string): boolean {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId);
  return hasPermission(user, perm);
}

export function useCanManageUsers(): boolean {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId);
  if (!user || !user.actif) return false;
  return hasPermission(user, "utilisateurs:manage");
}

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
