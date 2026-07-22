"use client";

import { useNav, type ViewKey } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { hasPermission, resolvePermissionUser } from "@/lib/permissions";
import { VIEW_PERMISSIONS } from "@/lib/nav-items";
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

/**
 * Retourne true si l'utilisateur connecté a le droit de VOIR cette vue
 * (permission `:read` du module). À consulter à chaque point d'entrée vers
 * une vue — rendu (AppShell), routage direct par URL (RouteSync), et
 * recherche (CommandPalette) — sinon la navigation sidebar reste filtrée
 * mais une URL tapée à la main ou ⌘K contournent totalement la règle.
 */
export function useCanView(view: ViewKey | null | undefined): boolean {
  const effective = useEffectivePermissionUser();
  if (!view) return false;
  const perm = VIEW_PERMISSIONS[view];
  if (!perm) return true;
  return hasPermission(effective, perm);
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
