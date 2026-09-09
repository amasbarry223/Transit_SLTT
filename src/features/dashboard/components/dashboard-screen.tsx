"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { useSession } from "@/lib/session/session-store";
import * as React from "react";
import {
  Package,
  Users,
  FileText,
  Ship,
  Truck,
  Calendar,
  ChevronDown,
} from "lucide-react";

import { DashboardKpiCard } from "@/components/sltt/dashboard/dashboard-kpi-card";
import { PromoActionCard } from "@/components/sltt/dashboard/promo-action-card";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { getDashboardAnchorDate, getDashboardAnchorDayKey } from "@/lib/calendar-anchor";
import { getDashboardSections, type DashboardSection } from "@/lib/dashboard-config";
import type { LiveAlert } from "@/lib/dashboard-metrics";
import { useBeneficeParSociete } from "@/shared/hooks/use-benefice-par-societe";
import { useCurrentUser } from "@/shared/hooks/use-permission";
import { cn } from "@/shared/utils/cn";

import { AgentPanel } from "@/components/sltt/dashboard/agent-panel";
import { ComptablePanel } from "@/components/sltt/dashboard/comptable-panel";
import { AdminPanel } from "@/components/sltt/dashboard/admin-panel";
import { DossiersEvolutionChartLazy } from "@/components/sltt/dashboard/dossiers-evolution-chart-lazy";
import { StockRepartitionChartLazy } from "@/components/sltt/dashboard/stock-repartition-chart-lazy";
import { DerniersDossiersCard } from "@/components/sltt/dashboard/derniers-dossiers-card";
import { AlertesCard } from "@/components/sltt/dashboard/alertes-card";
import { useDashboardMetrics } from "@/components/sltt/dashboard/use-dashboard-metrics";

const SLTT_GRID = "#E2E8F0";

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const currentUserName = useSession((s) => s.currentUserName);
  const theme = useUiPrefs((s) => s.theme);
  const isDark = theme === "dark";
  const gridColor = isDark ? "#27283F" : SLTT_GRID;
  const tickColor = isDark ? "#92A3BA" : "#64748B";
  const barCursorFill = isDark ? "#27283F" : "#F1F5F9";

  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const stock = useStore((s) => s.stock);
  const bons = useStore((s) => s.bons);
  const users = useStore((s) => s.usersPublic);
  const clients = useStore((s) => s.clients);
  const currentUser = useCurrentUser();
  const currentRole = currentUser?.role ?? "Administrateur";

  const sections = React.useMemo(
    () => getDashboardSections(currentUser),
    [currentUser],
  );
  const hasSection = (section: DashboardSection) => sections.has(section);

  const anchorDayKey = getDashboardAnchorDayKey();
  const anchorDate = React.useMemo(() => getDashboardAnchorDate(), [anchorDayKey]);
  const { ecrituresAvecDate } = useBeneficeParSociete(anchorDate);

  const periodeLabel = anchorDate
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  const {
    dossiersEnCours,
    valeurStock,
    dossiersParMois,
    stockRepartition,
    derniersDossiers,
    alertes,
  } = useDashboardMetrics({ dossiers, factures, stock, ecrituresAvecDate, anchorDate });

  const filteredAlertes = React.useMemo(() => {
    const items: LiveAlert[] = [];
    if (hasSection("alertes_stock")) {
      items.push(...alertes.filter((a) => a.id.startsWith("stock-")));
    }
    if (hasSection("alertes_dossiers")) {
      items.push(...alertes.filter((a) => !a.id.startsWith("stock-")));
    }
    return items.length > 0 ? items : alertes;
  }, [alertes, sections]);

  const firstName = currentUserName ? currentUserName.split(" ")[0] : "Amadou";

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header Dashboard matching reference image */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
          Bienvenue, {firstName} ! Voici l&apos;ensemble de votre activité ce mois-ci.
        </p>

        {/* Filter bar directly below subtitle */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-white dark:bg-card px-3.5 py-1.5 text-xs font-semibold shadow-2xs">
            <Calendar className="size-3.5 text-slate-500" />
            <span className="text-foreground font-bold">{periodeLabel}</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span>+12%</span>
            </span>
            <span className="text-muted-foreground font-normal">vs mois dernier</span>
          </div>
        </div>
      </div>

      {/* 2. 5 Vibrant Solid Colored KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total dossiers — Royal Blue */}
        <DashboardKpiCard
          label="Total dossiers"
          value={dossiers.length}
          icon={Package}
          variant="royal"
          trend={{ value: 12, label: "vs mois dernier", isPositive: true }}
          onClick={() => go("dossiers")}
        />

        {/* Card 2: Clients — Blue */}
        <DashboardKpiCard
          label="Clients"
          value={clients.length}
          icon={Users}
          variant="blue"
          trend={{ value: 8, label: "vs mois dernier", isPositive: true }}
          onClick={() => go("clients")}
        />

        {/* Card 3: Factures — Vibrant Red */}
        <DashboardKpiCard
          label="Factures"
          value={factures.length}
          icon={FileText}
          variant="red"
          trend={{ value: 15, label: "vs mois dernier", isPositive: true }}
          onClick={() => go("factures")}
        />

        {/* Card 4: Bons de sortie — Deep Navy */}
        <DashboardKpiCard
          label="Bons de sortie"
          value={bons.length}
          icon={Ship}
          variant="navy"
          trend={{ value: 10, label: "vs mois dernier", isPositive: true }}
          onClick={() => go("bons")}
        />

        {/* Card 5: Dossiers en cours — Blue */}
        <DashboardKpiCard
          label="Dossiers en cours"
          value={dossiersEnCours}
          icon={Truck}
          variant="blue"
          trend={{ value: 6, label: "vs mois dernier", isPositive: true }}
          onClick={() => go("dossiers")}
        />
      </div>

      {/* 3. Main Two-Column Layout matching reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (58% width): Vue Administrateur */}
        <div className="lg:col-span-7 flex flex-col">
          {currentRole === "Administrateur" ? (
            <AdminPanel
              go={go}
              users={users}
              alertes={alertes}
              dossiersCount={dossiers.length}
              clientsCount={clients.length}
              className="h-full"
            />
          ) : currentRole === "Agent de transit" ? (
            <AgentPanel
              go={go as (v: "dossiers" | "devis", opts?: { id?: string | null }) => void}
              openDossier={openDossier}
            />
          ) : currentRole === "Comptable" ? (
            <ComptablePanel go={go as (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void} />
          ) : (
            <AdminPanel
              go={go}
              users={users}
              alertes={alertes}
              dossiersCount={dossiers.length}
              clientsCount={clients.length}
              className="h-full"
            />
          )}
        </div>

        {/* Right Column (42% width): Promo Card + 2 Analytics Charts */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Top: Logistics Promo Banner */}
          <PromoActionCard
            onNewDossier={() => openDossier(null, "create")}
          />

          {/* Bottom: 2 Analytics Cards side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <DossiersEvolutionChartLazy
              data={dossiersParMois}
              gridColor={gridColor}
              tickColor={tickColor}
              barCursorFill={barCursorFill}
            />
            <StockRepartitionChartLazy
              data={stockRepartition}
              totalValue={valeurStock}
            />
          </div>
        </div>
      </div>

      {/* 4. Activités Récentes & Alertes (Secondary / scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start pt-2">
        <div className={cn(filteredAlertes.length > 0 ? "lg:col-span-2" : "lg:col-span-3")}>
          <DerniersDossiersCard
            dossiers={derniersDossiers}
            onGoToDossiers={() => go("dossiers")}
            onOpenDossier={(id) => go("dossier-detail", { id })}
          />
        </div>

        {filteredAlertes.length > 0 && (
          <div className="lg:col-span-1">
            <AlertesCard
              alertes={filteredAlertes}
              onAlertClick={(alert) =>
                go(alert.target.view, alert.target.id ? { id: alert.target.id } : undefined)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
