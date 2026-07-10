"use client";

import { useEffect } from "react";
import { useNav, type ViewKey } from "@/lib/nav-store";
import { syncNavFromRoute } from "@/lib/app-navigation";

type RouteSyncProps = {
  view: ViewKey;
  id: string;
  dossierMode?: "create" | "edit";
  devisEdit?: boolean;
};

export function RouteSync({ view, id, dossierMode, devisEdit }: RouteSyncProps) {
  useEffect(() => {
    const nav = useNav.getState();
    syncNavFromRoute(view, id, nav, { dossierMode, devisEdit });
  }, [view, id, dossierMode, devisEdit]);

  return null;
}
