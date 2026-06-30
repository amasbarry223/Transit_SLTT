"use client";

import { useNav } from "@/lib/nav-store";
import { Sidebar, MobileNav } from "./sidebar";
import { Topbar } from "./topbar";

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

export function AppShell() {
  const view = useNav((s) => s.view);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <MobileNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="w-full">
            {view === "dashboard" && <DashboardScreen />}
            {view === "dossiers" && <DossiersListScreen />}
            {view === "dossier-form" && <DossierFormScreen />}
            {view === "dossier-detail" && <DossierDetailScreen />}
            {view === "comptabilite" && <ComptabiliteScreen />}
            {view === "bilans" && <BilansScreen />}
            {view === "entreposage" && <EntreposageScreen />}
            {view === "bons" && <BonsScreen />}
            {view === "clients" && <ClientsScreen />}
            {view === "client-fiche" && <ClientFicheScreen />}
            {view === "devis" && <DevisScreen />}
            {view === "devis-detail" && <DevisDetailScreen />}
            {view === "calendrier" && <CalendrierScreen />}
            {view === "transporteurs" && <TransporteursScreen />}
            {view === "factures" && <FacturesScreen />}
            {view === "facture-detail" && <FactureDetailScreen />}
            {view === "parametres" && <ParametresScreen />}
          </div>
        </main>
      </div>
    </div>
  );
}
