"use client";

import dynamic from "next/dynamic";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { useCanView } from "@/shared/hooks/use-permission";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { ScreenSkeleton } from "@/components/sltt/screen-skeleton";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/shared/utils/cn";
import { UI } from "@/shared/utils/ui-messages";

/**
 * Écrans chargés à la demande (un seul est monté à la fois, selon `view`)
 * plutôt qu'importés en dur : ce fichier est rendu pour TOUTE page de
 * l'app (le routage réel se fait côté client via nav-store, pas par route
 * Next.js), donc un import statique ici mettait le JS des 21 écrans — y
 * compris les plus lourds (éditeur de tableur Univer pour l'import stock,
 * l'aperçu OCR, l'import Excel en masse) — dans le bundle initial de
 * n'importe quelle page, même le Dashboard seul. `ssr: false` : le choix
 * de l'écran dépend de `view`, un état client (Zustand) non connu au
 * moment du rendu serveur.
 */
const DashboardScreen = dynamic(
  () => import("@/features/dashboard").then((m) => m.DashboardScreen),
  { loading: () => <ScreenSkeleton view="dashboard" />, ssr: false },
);
const DossiersListScreen = dynamic(
  () => import("@/features/dossiers").then((m) => m.DossiersListScreen),
  { loading: () => <ScreenSkeleton view="dossiers" />, ssr: false },
);
const DossierFormScreen = dynamic(
  () => import("@/features/dossiers").then((m) => m.DossierFormScreen),
  { loading: () => <ScreenSkeleton view="dossier-form" />, ssr: false },
);
const DossierDetailScreen = dynamic(
  () => import("@/features/dossiers").then((m) => m.DossierDetailScreen),
  { loading: () => <ScreenSkeleton view="dossier-detail" />, ssr: false },
);
const DossierOcrReviewScreen = dynamic(
  () => import("@/features/dossiers").then((m) => m.DossierOcrReviewScreen),
  { loading: () => <ScreenSkeleton view="dossier-ocr-review" />, ssr: false },
);
const ComptabiliteScreen = dynamic(
  () => import("@/features/comptabilite").then((m) => m.ComptabiliteScreen),
  { loading: () => <ScreenSkeleton view="comptabilite" />, ssr: false },
);
const RecusPaiementScreen = dynamic(
  () => import("@/features/recus-paiement").then((m) => m.RecusPaiementScreen),
  { loading: () => <ScreenSkeleton view="recus-paiement" />, ssr: false },
);
const BilansScreen = dynamic(
  () => import("@/features/bilans").then((m) => m.BilansScreen),
  { loading: () => <ScreenSkeleton view="bilans" />, ssr: false },
);
const EntreposageScreen = dynamic(
  () => import("@/features/entreposage").then((m) => m.EntreposageScreen),
  { loading: () => <ScreenSkeleton view="entreposage" />, ssr: false },
);
const BonsScreen = dynamic(
  () => import("@/features/bons").then((m) => m.BonsScreen),
  { loading: () => <ScreenSkeleton view="bons" />, ssr: false },
);
const ContratsScreen = dynamic(
  () => import("@/features/contrats").then((m) => m.ContratsScreen),
  { loading: () => <ScreenSkeleton view="contrats" />, ssr: false },
);
const ContratDetailScreen = dynamic(
  () => import("@/features/contrats").then((m) => m.ContratDetailScreen),
  { loading: () => <ScreenSkeleton view="contrat-detail" />, ssr: false },
);
const ClientsScreen = dynamic(
  () => import("@/features/clients").then((m) => m.ClientsScreen),
  { loading: () => <ScreenSkeleton view="clients" />, ssr: false },
);
const ClientFicheScreen = dynamic(
  () => import("@/features/clients").then((m) => m.ClientFicheScreen),
  { loading: () => <ScreenSkeleton view="client-fiche" />, ssr: false },
);
const DevisScreen = dynamic(
  () => import("@/features/devis").then((m) => m.DevisScreen),
  { loading: () => <ScreenSkeleton view="devis" />, ssr: false },
);
const DevisDetailScreen = dynamic(
  () => import("@/features/devis").then((m) => m.DevisDetailScreen),
  { loading: () => <ScreenSkeleton view="devis-detail" />, ssr: false },
);
const TransporteursScreen = dynamic(
  () => import("@/features/transporteurs").then((m) => m.TransporteursScreen),
  { loading: () => <ScreenSkeleton view="transporteurs" />, ssr: false },
);
const FacturesScreen = dynamic(
  () => import("@/features/factures").then((m) => m.FacturesScreen),
  { loading: () => <ScreenSkeleton view="factures" />, ssr: false },
);
const FactureDetailScreen = dynamic(
  () => import("@/features/factures").then((m) => m.FactureDetailScreen),
  { loading: () => <ScreenSkeleton view="facture-detail" />, ssr: false },
);
const FournisseursScreen = dynamic(
  () => import("@/features/fournisseurs").then((m) => m.FournisseursScreen),
  { loading: () => <ScreenSkeleton view="fournisseurs" />, ssr: false },
);
const ArchivesScreen = dynamic(
  () => import("@/features/archives").then((m) => m.ArchivesScreen),
  { loading: () => <ScreenSkeleton view="archives" />, ssr: false },
);
const ParametresScreen = dynamic(
  () => import("@/features/parametres").then((m) => m.ParametresScreen),
  { loading: () => <ScreenSkeleton view="parametres" />, ssr: false },
);

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
          <div className="h-0.5 w-full overflow-hidden bg-muted">
            <div className="h-full w-1/3 animate-pulse bg-primary/70" />
          </div>
        )}
        {loadError && !dataLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-900/60 dark:bg-red-950/40">
            <div className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {UI.empty.loadError.title}. {UI.empty.loadError.description}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { clearLoadError(); fetchData(); }}>
                {UI.empty.loadError.action}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearLoadError}>
                {UI.buttons.close}
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
            isRecuWorkspace ? "overflow-hidden p-0" : "p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8",
          )}
        >
          <div className={cn("w-full", isRecuWorkspace && "h-full min-h-0")}>
            {isInitialLoad ? (
              <ScreenSkeleton view={view} />
            ) : !canViewCurrent ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <ShieldAlert className="size-7" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Accès non autorisé</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
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
            {view === "dossier-ocr-review" && <DossierOcrReviewScreen />}
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
        <BottomNav />
      </div>
    </div>
  );
}
