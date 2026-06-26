"use client";

import { useNav } from "@/lib/nav-store";
import { Sidebar, MobileNav } from "./sidebar";
import { Topbar } from "./topbar";
import { DashboardScreen } from "@/components/sltt/screens/dashboard";
import { DossiersListScreen } from "@/components/sltt/screens/dossiers-list";
import { DossierFormScreen } from "@/components/sltt/screens/dossier-form";
import { ComptabiliteScreen } from "@/components/sltt/screens/comptabilite";
import { BilansScreen } from "@/components/sltt/screens/bilans";
import { EntreposageScreen } from "@/components/sltt/screens/entreposage";
import { BonsScreen } from "@/components/sltt/screens/bons";
import { ClientsScreen } from "@/components/sltt/screens/clients";
import { ClientFicheScreen } from "@/components/sltt/screens/client-fiche";
import { ParametresScreen } from "@/components/sltt/screens/parametres";

export function AppShell() {
  const view = useNav((s) => s.view);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {view === "dashboard" && <DashboardScreen />}
            {view === "dossiers" && <DossiersListScreen />}
            {view === "dossier-form" && <DossierFormScreen />}
            {view === "comptabilite" && <ComptabiliteScreen />}
            {view === "bilans" && <BilansScreen />}
            {view === "entreposage" && <EntreposageScreen />}
            {view === "bons" && <BonsScreen />}
            {view === "clients" && <ClientsScreen />}
            {view === "client-fiche" && <ClientFicheScreen />}
            {view === "parametres" && <ParametresScreen />}
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
        <p>
          © 2026 SLTT — Société Traoré de Logistique, Transit et Transport.
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Accès sécurisé
          </span>
          <span className="text-slate-300">·</span>
          <span>Plateforme de gestion v1.0</span>
        </p>
      </div>
    </footer>
  );
}
