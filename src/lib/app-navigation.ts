"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNav, type ViewKey } from "@/lib/nav-store";

const DETAIL_ROUTES: Partial<Record<ViewKey, (id: string) => string>> = {
  "client-fiche": (id) => `/clients/${id}`,
  "dossier-detail": (id) => `/dossiers/${id}`,
  "facture-detail": (id) => `/factures/${id}`,
  "devis-detail": (id) => `/devis/${id}`,
  "contrat-detail": (id) => `/contrats/${id}`,
};

export function useAppNavigation() {
  const router = useRouter();
  const nav = useNav();

  const pushDetail = useCallback(
    (view: ViewKey, id: string, open: (id: string) => void) => {
      open(id);
      const path = DETAIL_ROUTES[view]?.(id);
      if (path) router.push(path);
    },
    [router],
  );

  const goToClient = useCallback(
    (id: string) => pushDetail("client-fiche", id, nav.openClient),
    [nav.openClient, pushDetail],
  );

  const goToDossier = useCallback(
    (id: string) => pushDetail("dossier-detail", id, nav.openDossierDetail),
    [nav.openDossierDetail, pushDetail],
  );

  const goToFacture = useCallback(
    (id: string) => {
      nav.go("facture-detail", { id });
      router.push(`/factures/${id}`);
    },
    [nav, router],
  );

  const goToDevis = useCallback(
    (id: string, edit = false) => {
      nav.openDevisDetail(id, edit);
      router.push(`/devis/${id}`);
    },
    [nav, router],
  );

  const goToContrat = useCallback(
    (id: string) => pushDetail("contrat-detail", id, nav.openContratDetail),
    [nav.openContratDetail, pushDetail],
  );

  const goToNewDossier = useCallback(() => {
    nav.openDossier(null, "create");
    router.push("/dossiers/new");
  }, [nav, router]);

  const goToView = useCallback(
    (view: ViewKey, opts?: { id?: string | null }) => {
      nav.go(view, opts);
      if (view === "dashboard") router.push("/");
      else if (view === "dossier-form" && opts?.id == null) router.push("/dossiers/new");
    },
    [nav, router],
  );

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    nav.go("dashboard");
    router.push("/");
  }, [nav, router]);

  return {
    ...nav,
    goToClient,
    goToDossier,
    goToFacture,
    goToDevis,
    goToContrat,
    goToNewDossier,
    goToView,
    goBack,
  };
}

/** Synchronise l'URL vers le nav-store au chargement d'une route détail. */
export function syncNavFromRoute(
  view: ViewKey,
  id: string,
  actions: Pick<
    ReturnType<typeof useNav.getState>,
    "openClient" | "openDossierDetail" | "openDevisDetail" | "go" | "openDossier" | "openContratDetail"
  >,
  opts?: { dossierMode?: "create" | "edit"; devisEdit?: boolean },
) {
  switch (view) {
    case "client-fiche":
      actions.openClient(id);
      break;
    case "dossier-detail":
      actions.openDossierDetail(id);
      break;
    case "dossier-form":
      actions.openDossier(id === "new" ? null : id, opts?.dossierMode ?? "edit");
      break;
    case "facture-detail":
      actions.go("facture-detail", { id });
      break;
    case "devis-detail":
      actions.openDevisDetail(id, opts?.devisEdit ?? false);
      break;
    case "contrat-detail":
      actions.openContratDetail(id);
      break;
    default:
      break;
  }
}
