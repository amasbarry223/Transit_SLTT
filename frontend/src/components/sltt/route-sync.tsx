"use client";

import { useEffect } from "react";
import { useNav, type ComptaTab, type ViewKey } from "@/lib/nav-store";
import { syncNavFromRoute } from "@/lib/app-navigation";

type RouteSyncProps = {
  view: ViewKey;
  id?: string;
  dossierMode?: "create" | "edit";
  devisEdit?: boolean;
  comptaTab?: ComptaTab;
};

export function RouteSync({ view, id, dossierMode, devisEdit, comptaTab }: RouteSyncProps) {
  useEffect(() => {
    const nav = useNav.getState();
    syncNavFromRoute(view, id, nav, { dossierMode, devisEdit, comptaTab });
  }, [view, id, dossierMode, devisEdit, comptaTab]);

  return null;
}
