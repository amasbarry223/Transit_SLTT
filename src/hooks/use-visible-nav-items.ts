"use client";

import { useMemo } from "react";
import { navItems, type NavItem } from "@/lib/nav-items";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { hasPermission } from "@/lib/permissions";

export function useVisibleNavItems(): NavItem[] {
  const currentUserId = useNav((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId);

  return useMemo(
    () =>
      navItems.filter((item) => {
        if (!item.requiredPermission) return true;
        return hasPermission(user, item.requiredPermission);
      }),
    [user],
  );
}
