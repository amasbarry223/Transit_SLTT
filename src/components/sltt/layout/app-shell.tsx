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
          <div className="w-full">
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
      </div>
    </div>
  );
}
