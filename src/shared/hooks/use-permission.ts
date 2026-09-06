"use client";

import { useSession } from "@/lib/session/session-store";

import { type ViewKey } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { hasPermission, resolvePermissionUser } from "@/lib/permissions";
import { VIEW_PERMISSIONS } from "@/lib/nav-items";
import type { UserRole } from "@/lib/domain-types";

function useEffectivePermissionUser() {
  const currentUserId = useSession((s) => s.currentUserId);
  const currentRole = useSession((s) => s.currentRole);
  const user = useStore((s) => s.users.find((u) => u.id === currentUserId));

  if (user) {
    return resolvePermissionUser(user);
  }

  if (currentRole) {
    return resolvePermissionUser(null, currentRole);
  }

  return null;
}

/** True lorsque le profil connecté est chargé et utilisable pour les checks UI. */
export function usePermissionsReady(): boolean {
  const currentUserId = useSession((s) => s.currentUserId);
  const currentRole = useSession((s) => s.currentRole);
  const hasUser = useStore((s) => s.users.some((u) => u.id === currentUserId));
  if (!currentUserId) return false;
  return hasUser || Boolean(currentRole);
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
  const currentUserId = useSession((s) => s.currentUserId);
  const user = useStore((s) => s.users.find((u) => u.id === currentUserId));
  if (!currentUserId || !user) return false;
  if (!user.actif) return false;
  return (roles as string[]).includes(user.role);
}

/** Retourne l'objet User de l'utilisateur connecté, ou null. */
export function useCurrentUser() {
  const currentUserId = useSession((s) => s.currentUserId);
  const user = useStore((s) => s.users.find((u) => u.id === currentUserId));
  return user ?? null;
}
