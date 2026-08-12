"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNav, type ComptaTab, type ViewKey } from "@/lib/nav-store";

/** Chemins URL pour chaque vue — deep-links list + détail. */
export function pathForView(
  view: ViewKey,
  id?: string | null,
  comptaTab?: ComptaTab,
): string {
  switch (view) {
    case "dashboard":
      return "/";
    case "dossiers":
      return "/dossiers";
    case "dossier-form":
      return id ? `/dossiers/${id}/edit` : "/dossiers/new";
    case "dossier-detail":
      return id ? `/dossiers/${id}` : "/dossiers";
    case "comptabilite":
      return comptaTab ? `/comptabilite?tab=${comptaTab}` : "/comptabilite";
    case "recus-paiement":
      return "/recus/nouveau";
    case "bilans":
      return "/bilans";
    case "entreposage":
      return "/entreposage";
    case "bons":
      return "/bons";
    case "clients":
      return "/clients";
    case "client-fiche":
      return id ? `/clients/${id}` : "/clients";
    case "devis":
      return "/devis";
    case "devis-detail":
      return id ? `/devis/${id}` : "/devis";
    case "calendrier":
      return "/calendrier";
    case "transporteurs":
      return "/transporteurs";
    case "factures":
      return "/factures";
    case "facture-detail":
      return id ? `/factures/${id}` : "/factures";
    case "fournisseurs":
      return "/fournisseurs";
    case "contrats":
      return "/contrats";
    case "contrat-detail":
      return id ? `/contrats/${id}` : "/contrats";
    case "archives":
      return "/archives";
    case "parametres":
      return "/parametres";
    default:
      return "/";
  }
}

export function useAppNavigation() {
  const router = useRouter();
  const nav = useNav();

  const pushPath = useCallback(
    (path: string) => {
      if (typeof window !== "undefined") {
        const current = `${window.location.pathname}${window.location.search}`;
        if (current === path) return;
      }
      router.push(path);
    },
    [router],
  );

  const goToView = useCallback(
    (view: ViewKey, opts?: { id?: string | null; comptaTab?: ComptaTab }) => {
      const comptaTab =
        opts?.comptaTab ?? (view === "comptabilite" ? nav.comptaTab : undefined);
      nav.go(view, view === "comptabilite" ? { ...opts, comptaTab } : opts);
      pushPath(pathForView(view, opts?.id, view === "comptabilite" ? comptaTab : undefined));
    },
    [nav, pushPath],
  );

  const goToClient = useCallback(
    (id: string) => {
      nav.openClient(id);
      pushPath(pathForView("client-fiche", id));
    },
    [nav, pushPath],
  );

  const goToDossier = useCallback(
    (id: string) => {
      nav.openDossierDetail(id);
      pushPath(pathForView("dossier-detail", id));
    },
    [nav, pushPath],
  );

  const goToFacture = useCallback(
    (id: string) => {
      nav.go("facture-detail", { id });
      pushPath(pathForView("facture-detail", id));
    },
    [nav, pushPath],
  );

  const goToDevis = useCallback(
    (id: string, edit = false) => {
      nav.openDevisDetail(id, edit);
      pushPath(pathForView("devis-detail", id));
    },
    [nav, pushPath],
  );

  const goToContrat = useCallback(
    (id: string) => {
      nav.openContratDetail(id);
      pushPath(pathForView("contrat-detail", id));
    },
    [nav, pushPath],
  );

  const goToNewDossier = useCallback(() => {
    nav.openDossier(null, "create");
    pushPath(pathForView("dossier-form"));
  }, [nav, pushPath]);

  const goToNewDevis = useCallback(() => {
    nav.go("devis", { id: "new" });
    pushPath(pathForView("devis"));
  }, [nav, pushPath]);

  const goToNewFacture = useCallback(() => {
    nav.go("factures", { id: "new" });
    pushPath(pathForView("factures"));
  }, [nav, pushPath]);

  const goToNewRecu = useCallback(() => {
    nav.go("recus-paiement");
    pushPath(pathForView("recus-paiement"));
  }, [nav, pushPath]);

  const goToCompta = useCallback(
    (tab: ComptaTab) => {
      goToView("comptabilite", { comptaTab: tab });
    },
    [goToView],
  );

  const goToEditDossier = useCallback(
    (id: string) => {
      nav.openDossier(id, "edit");
      pushPath(pathForView("dossier-form", id));
    },
    [nav, pushPath],
  );

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    nav.go("dashboard");
    pushPath("/");
  }, [nav, pushPath, router]);

  return {
    ...nav,
    goToClient,
    goToDossier,
    goToFacture,
    goToDevis,
    goToContrat,
    goToNewDossier,
    goToNewDevis,
    goToNewFacture,
    goToNewRecu,
    goToCompta,
    goToEditDossier,
    goToView,
    goBack,
  };
}

/** Synchronise l'URL vers le nav-store au chargement d'une route. */
export function syncNavFromRoute(
  view: ViewKey,
  id: string | undefined,
  actions: Pick<
    ReturnType<typeof useNav.getState>,
    "openClient" | "openDossierDetail" | "openDevisDetail" | "go" | "openDossier" | "openContratDetail"
  >,
  opts?: { dossierMode?: "create" | "edit"; devisEdit?: boolean; comptaTab?: ComptaTab },
) {
  switch (view) {
    case "client-fiche":
      if (id) actions.openClient(id);
      else actions.go("clients");
      break;
    case "dossier-detail":
      if (id) actions.openDossierDetail(id);
      else actions.go("dossiers");
      break;
    case "dossier-form":
      actions.openDossier(
        !id || id === "new" ? null : id,
        opts?.dossierMode ?? (id && id !== "new" ? "edit" : "create"),
      );
      break;
    case "facture-detail":
      if (id) actions.go("facture-detail", { id });
      else actions.go("factures");
      break;
    case "devis-detail":
      if (id) actions.openDevisDetail(id, opts?.devisEdit ?? false);
      else actions.go("devis");
      break;
    case "contrat-detail":
      if (id) actions.openContratDetail(id);
      else actions.go("contrats");
      break;
    case "comptabilite":
      actions.go("comptabilite", { comptaTab: opts?.comptaTab ?? "ecritures" });
      break;
    default:
      actions.go(view, id ? { id } : undefined);
      break;
  }
}
