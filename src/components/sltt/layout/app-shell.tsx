"use client";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { useCanView } from "@/hooks/use-permission";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";

import { DashboardScreen } from "@/components/sltt/screens/dashboard";
import { DossiersListScreen } from "@/components/sltt/screens/dossiers-list";
import { DossierFormScreen } from "@/components/sltt/screens/dossier-form";
import { DossierDetailScreen } from "@/components/sltt/screens/dossier-detail";
import { ComptabiliteScreen } from "@/components/sltt/screens/comptabilite";
import { BilansScreen } from "@/components/sltt/screens/bilans";
import { EntreposageScreen } from "@/components/sltt/screens/entreposage";
import { BonsScreen } from "@/components/sltt/screens/bons";
import { ClientsScreen } from "@/components/sltt/screens/clients";
import { ClientFicheScreen } from "@/components/sltt/screens/client-fiche";
import { ParametresScreen } from "@/components/sltt/screens/parametres";
import { DevisScreen } from "@/components/sltt/screens/devis";
import { DevisDetailScreen } from "@/components/sltt/screens/devis-detail";
import { CalendrierScreen } from "@/components/sltt/screens/calendrier";
import { TransporteursScreen } from "@/components/sltt/screens/transporteurs";
import { FacturesScreen } from "@/components/sltt/screens/factures";
import { FactureDetailScreen } from "@/components/sltt/screens/facture-detail";
import { FournisseursScreen } from "@/components/sltt/screens/fournisseurs";
import { ContratsScreen } from "@/components/sltt/screens/contrats";
import { ContratDetailScreen } from "@/components/sltt/screens/contrat-detail";
import { ArchivesScreen } from "@/components/sltt/screens/archives";

export function AppShell() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const dataLoading = useStore((s) => s.dataLoading);
  const loadError = useStore((s) => s.loadError);
  const fetchData = useStore((s) => s.fetchData);
  const clearLoadError = useStore((s) => s.clearLoadError);
  // Dernier rempart de permission : la sidebar/le breadcrumb/la palette de
  // commandes filtrent déjà ce qu'ils proposent, mais une URL tapée à la
  // main ou un état restauré peut viser une vue interdite — on ne rend
  // jamais l'écran cible dans ce cas, quel que soit le point d'entrée.
  const canViewCurrent = useCanView(view);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {dataLoading && (
          <div className="flex items-center gap-2 border-b border-border/60 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
            <Loader2 className="size-4 animate-spin" />
            Chargement des données…
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="w-full">
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
            ) : (
            <>
            {view === "dashboard" && <DashboardScreen />}
            {view === "dossiers" && <DossiersListScreen />}
            {view === "dossier-form" && <DossierFormScreen />}
            {view === "dossier-detail" && <DossierDetailScreen />}
            {view === "comptabilite" && <ComptabiliteScreen />}
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
