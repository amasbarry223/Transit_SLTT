"use client";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { useCanView } from "@/hooks/use-permission";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import {
  ArchivesScreen,
  BilansScreen,
  BonsScreen,
  CalendrierScreen,
  ClientFicheScreen,
  ClientsScreen,
  ComptabiliteScreen,
  ContratDetailScreen,
  ContratsScreen,
  DashboardScreen,
  DevisDetailScreen,
  DevisScreen,
  DossierDetailScreen,
  DossierFormScreen,
  DossiersListScreen,
  EntreposageScreen,
  FactureDetailScreen,
  FacturesScreen,
  FournisseursScreen,
  ParametresScreen,
  RecusPaiementScreen,
  TransporteursScreen,
} from "@/components/sltt/screens";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { ScreenSkeleton } from "@/components/sltt/screen-skeleton";
import { cn } from "@/lib/utils";

export function AppShell() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const dataLoading = useStore((s) => s.dataLoading);
  const loadError = useStore((s) => s.loadError);
  const partialLoadWarning = useStore((s) => s.partialLoadWarning);
  const lastSyncedAt = useStore((s) => s.lastSyncedAt);
  const fetchData = useStore((s) => s.fetchData);
  const clearLoadError = useStore((s) => s.clearLoadError);
  const clearPartialLoadWarning = useStore((s) => s.clearPartialLoadWarning);
  // Dernier rempart de permission : la sidebar/le breadcrumb/la palette de
  // commandes filtrent déjà ce qu'ils proposent, mais une URL tapée à la
  // main ou un état restauré peut viser une vue interdite — on ne rend
  // jamais l'écran cible dans ce cas, quel que soit le point d'entrée.
  const canViewCurrent = useCanView(view);
  const isInitialLoad = lastSyncedAt === null && !loadError;
  const isRecuWorkspace = view === "recus-paiement" && canViewCurrent && !isInitialLoad;

  return (
    <div className={cn("flex bg-background", isRecuWorkspace ? "h-dvh min-h-0 overflow-hidden" : "min-h-screen")}>
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar />
        <OfflineIndicator />
        {dataLoading && lastSyncedAt !== null && (
          <div className="h-0.5 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <div className="h-full w-1/3 animate-pulse bg-primary/70" />
          </div>
        )}
        {loadError && !dataLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-900/60 dark:bg-red-950/40">
            <div className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>Impossible de charger les données : {loadError}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { clearLoadError(); fetchData(); }}>
                Réessayer
              </Button>
              <Button size="sm" variant="ghost" onClick={clearLoadError}>
                Fermer
              </Button>
            </div>
          </div>
        )}
        {!loadError && partialLoadWarning && !dataLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900/60 dark:bg-amber-950/40">
            <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{partialLoadWarning}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { clearPartialLoadWarning(); fetchData(); }}>
                Réessayer
              </Button>
              <Button size="sm" variant="ghost" onClick={clearPartialLoadWarning}>
                Fermer
              </Button>
            </div>
          </div>
        )}
        <main
          className={cn(
            "min-h-0 flex-1",
            isRecuWorkspace ? "overflow-hidden p-0" : "p-4 sm:p-6 lg:p-8",
          )}
        >
          <div className={cn("w-full", isRecuWorkspace && "h-full min-h-0")}>
            {!canViewCurrent ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <ShieldAlert className="size-7" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Accès non autorisé</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Vous n&apos;avez pas la permission de consulter cette page.
                  </p>
                </div>
                <Button variant="outline" onClick={() => go("dashboard")}>
                  Retour au tableau de bord
                </Button>
              </div>
            ) : isInitialLoad ? (
              <ScreenSkeleton view={view} />
            ) : (
            <>
            {view === "dashboard" && <DashboardScreen />}
            {view === "dossiers" && <DossiersListScreen />}
            {view === "dossier-form" && <DossierFormScreen />}
            {view === "dossier-detail" && <DossierDetailScreen />}
            {view === "comptabilite" && <ComptabiliteScreen />}
            {view === "recus-paiement" && <RecusPaiementScreen />}
            {view === "bilans" && <BilansScreen />}
            {view === "entreposage" && <EntreposageScreen />}
            {view === "bons" && <BonsScreen />}
            {view === "contrats" && <ContratsScreen />}
            {view === "contrat-detail" && <ContratDetailScreen />}
            {view === "clients" && <ClientsScreen />}
            {view === "client-fiche" && <ClientFicheScreen />}
            {view === "devis" && <DevisScreen />}
            {view === "devis-detail" && <DevisDetailScreen />}
            {view === "calendrier" && <CalendrierScreen />}
            {view === "transporteurs" && <TransporteursScreen />}
            {view === "factures" && <FacturesScreen />}
            {view === "facture-detail" && <FactureDetailScreen />}
            {view === "fournisseurs" && <FournisseursScreen />}
            {view === "archives" && <ArchivesScreen />}
            {view === "parametres" && <ParametresScreen />}
            </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
