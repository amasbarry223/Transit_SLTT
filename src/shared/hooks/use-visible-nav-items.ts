"use client";

import { useSession } from "@/lib/session/session-store";

import { useMemo } from "react";
import { navItems, type NavItem } from "@/lib/nav-items";
import { useStore } from "@/lib/store";
import { hasPermission, resolvePermissionUser } from "@/lib/permissions";

export function useVisibleNavItems(): NavItem[] {
  const currentUserId = useSession((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId);

  return useMemo(() => {
    // Pas de repli sur le rôle de session : sans profil hydraté, seuls
    // les items sans permission requise restent visibles.
    if (currentUserId && !user) {
      return navItems.filter((item) => !item.requiredPermission);
    }
    const effective = resolvePermissionUser(user);
    return navItems.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(effective, item.requiredPermission);
    });
  }, [user, currentUserId]);
}
