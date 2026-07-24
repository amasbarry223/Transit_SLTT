"use client";

import * as React from "react";
import {
  Wallet,
  Clock,
  FolderKanban,
  Warehouse,
  TrendingUp,
} from "lucide-react";

import { KpiCard } from "@/components/sltt/kpi-card";
import { PageHeader } from "@/components/sltt/page-header";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { getDashboardSections, kpiGridClass, type DashboardSection } from "@/lib/dashboard-config";
import type { LiveAlert } from "@/lib/dashboard-metrics";
import { useBeneficeParSociete } from "@/hooks/use-benefice-par-societe";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import { useCurrentUser } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";

import { AgentPanel } from "@/components/sltt/dashboard/agent-panel";
import { MagasinierPanel } from "@/components/sltt/dashboard/magasinier-panel";
import { ComptablePanel } from "@/components/sltt/dashboard/comptable-panel";
import { AdminPanel } from "@/components/sltt/dashboard/admin-panel";
import { GuideDemarrage } from "@/components/sltt/dashboard/guide-demarrage";
import { EncaissementsChart } from "@/components/sltt/dashboard/encaissements-chart";
import { MargeChart } from "@/components/sltt/dashboard/marge-chart";
import { DerniersDossiersCard } from "@/components/sltt/dashboard/derniers-dossiers-card";
import { StatutsDonutCard } from "@/components/sltt/dashboard/statuts-donut-card";
import { AlertesCard } from "@/components/sltt/dashboard/alertes-card";
import { useDashboardMetrics } from "@/components/sltt/dashboard/use-dashboard-metrics";

const SLTT_GRID = "#E2E8F0";

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);
  const theme = useNav((s) => s.theme);
  // Recharts dessine en SVG avec des couleurs passées en props — les classes
  // `dark:` de Tailwind n'ont aucune prise dessus, il faut donc calculer les
  // couleurs de grille/axes/curseur en JS selon le thème actif.
  const isDark = theme === "dark";
  const gridColor = isDark ? "#1E293B" : SLTT_GRID;
  const tickColor = isDark ? "#94A3B8" : "#64748B";
  const barCursorFill = isDark ? "#1E293B" : "#EFF6FF";
  const lineCursorStroke = isDark ? "#334155" : "#CBD5E1";
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const stock = useStore((s) => s.stock);
  const users = useStore((s) => s.usersPublic);
  const clients = useStore((s) => s.clients);
  const lastSyncedAt = useStore((s) => s.lastSyncedAt);
  const currentUser = useCurrentUser();
  const selectedSocieteId = useNav((s) => s.selectedSocieteId);

  const sections = React.useMemo(
    () => getDashboardSections(currentUser),
    [currentUser],
  );
  const hasSection = (section: DashboardSection) => sections.has(section);

  // Ancrage calendaire : date du jour (pas la date max des données)
  const anchorDate = getDashboardAnchorDate();
  const { ecrituresAvecDate, calculerBeneficeMensuel } = useBeneficeParSociete(anchorDate);
  const beneficeMoisCourant = calculerBeneficeMensuel(selectedSocieteId).benefice;

  const periodeLabel = anchorDate
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  const syncLabel = React.useMemo(() => {
    if (!lastSyncedAt) return null;
    const mins = Math.floor((Date.now() - lastSyncedAt) / 60000);
    if (mins < 1) return "Sync · à l'instant";
    if (mins < 60) return `Sync · il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    return `Sync · il y a ${hours}h`;
  }, [lastSyncedAt]);

  const {
    chiffreEncaisse,
    variationEncaisse,
    totalRestesAPayer,
    nbDossiersNonSoldes,
    dossiersEnCours,
    dossiersALivrer,
    valeurStock,
    encaissementsParMois,
    ecartsParPeriode,
    derniersDossiers,
    statutDonutData,
    totalDossiers,
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
    return items;
  }, [alertes, sections]);

  const visibleKpiCount = [
    hasSection("kpi_encaisse"),
    hasSection("kpi_restes"),
    hasSection("kpi_dossiers"),
    hasSection("kpi_stock"),
    hasSection("kpi_benefice"),
  ].filter(Boolean).length;

  const showChartsRow =
    hasSection("chart_encaissements") || hasSection("chart_marges");
  const showBlocksRow =
    hasSection("derniers_dossiers") ||
    hasSection("chart_statuts") ||
    hasSection("alertes_stock") ||
    hasSection("alertes_dossiers");

  const firstName = currentUserName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Tableau de bord"
        description={`Bonjour ${firstName} — Vue d'ensemble de votre activité ce mois-ci`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm shadow-sm">
            <span className="text-slate-500 dark:text-slate-400">Période :</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{periodeLabel}</span>
          </div>
          {syncLabel && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-500 shadow-sm dark:text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {syncLabel}
            </div>
          )}
          {hasSection("kpi_benefice") && <SocieteFilterSelect className="w-full sm:w-44" />}
        </div>
      </PageHeader>

      {/* 1b. GUIDE DE DÉMARRAGE — les 4 gestes du cahier des charges */}
      <GuideDemarrage role={currentRole} go={(v) => go(v)} />

      {/* 2. KPI ROW */}
      {visibleKpiCount > 0 && (
      <div className={cn("grid w-full gap-3 sm:gap-4", kpiGridClass(visibleKpiCount))}>
        {hasSection("kpi_encaisse") && (
        <KpiCard
          label="Encaissé ce mois"
          value={formatFCFA(chiffreEncaisse)}
          icon={Wallet}
          tone="emerald"
          variation={variationEncaisse}
          variationLabel="vs mois dernier"
          tooltip="Somme des encaissements du mois : paiements enregistrés via les écritures comptables et les factures. Les paiements dossier passent par les écritures liées ; les deux canaux sont additionnés, pas dédoublonnés."
        />
        )}
        {hasSection("kpi_restes") && (
        <KpiCard
          label="Restes à payer"
          value={formatFCFA(totalRestesAPayer)}
          icon={Clock}
          tone="amber"
          sublabel={`Sur ${nbDossiersNonSoldes} dossier${nbDossiersNonSoldes > 1 ? "s" : ""}`}
        />
        )}
        {hasSection("kpi_dossiers") && (
        <KpiCard
          label="Dossiers en cours"
          value={String(dossiersEnCours)}
          icon={FolderKanban}
          tone="blue"
          sublabel={dossiersALivrer > 0 ? `${dossiersALivrer} dédouané${dossiersALivrer > 1 ? "s" : ""} à livrer` : "Aucun en attente de livraison"}
        />
        )}
        {hasSection("kpi_stock") && (
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Warehouse}
          tone="indigo"
          sublabel={`${stock.length} article${stock.length > 1 ? "s" : ""}`}
        />
        )}
        {hasSection("kpi_benefice") && (
        <KpiCard
          label="Bénéfice ce mois"
          value={formatFCFA(beneficeMoisCourant)}
          icon={TrendingUp}
          tone={beneficeMoisCourant >= 0 ? "emerald" : "red"}
          sublabel="Recettes − Dépenses"
          tooltip="Recettes = écritures + paiements factures filtrés par société. Dépenses = dépenses de contrats filtrées par société. Voir Comptabilité pour le détail par société."
        />
        )}
      </div>
      )}

      {/* 2b. ROLE PANEL */}
      {currentRole === "Administrateur" && (
        <AdminPanel
          go={go}
          users={users}
          alertes={alertes}
          openDossierDetail={openDossierDetail}
          dossiersCount={dossiers.length}
          clientsCount={clients.length}
        />
      )}
      {currentRole === "Agent de transit" && (
        <AgentPanel
          go={go as (v: "dossiers" | "devis", opts?: { id?: string | null }) => void}
          openDossier={openDossier}
        />
      )}
      {currentRole === "Magasinier" && (
        <MagasinierPanel go={go as (v: "entreposage" | "bons", opts?: { id?: string | null }) => void} />
      )}
      {currentRole === "Comptable" && (
        <ComptablePanel go={go as (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void} />
      )}

      {/* 3. CHARTS ROW */}
      {showChartsRow && (
      <div className={cn("grid grid-cols-1 gap-6", hasSection("chart_encaissements") && hasSection("chart_marges") && "lg:grid-cols-2")}>
        {hasSection("chart_encaissements") && (
          <EncaissementsChart
            data={encaissementsParMois}
            gridColor={gridColor}
            tickColor={tickColor}
            barCursorFill={barCursorFill}
          />
        )}

        {hasSection("chart_marges") && (
          <MargeChart
            data={ecartsParPeriode}
            gridColor={gridColor}
            tickColor={tickColor}
            lineCursorStroke={lineCursorStroke}
          />
        )}
      </div>
      )}

      {/* 4. BLOCKS ROW */}
      {showBlocksRow && (
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

        {hasSection("derniers_dossiers") && (
          <DerniersDossiersCard
            dossiers={derniersDossiers}
            onGoToDossiers={() => go("dossiers")}
            onOpenDossier={(id) => go("dossier-detail", { id })}
            className={
              (hasSection("chart_statuts") || hasSection("alertes_stock") || hasSection("alertes_dossiers"))
                ? "lg:col-span-2"
                : "lg:col-span-3"
            }
          />
        )}

        {(hasSection("chart_statuts") || hasSection("alertes_stock") || hasSection("alertes_dossiers")) && (
        <div className={cn(
          "flex flex-col gap-6",
          hasSection("derniers_dossiers") ? "lg:col-span-1" : "lg:col-span-3",
        )}>

          {hasSection("chart_statuts") && (
            <StatutsDonutCard data={statutDonutData} totalDossiers={totalDossiers} />
          )}

          {(hasSection("alertes_stock") || hasSection("alertes_dossiers")) && (
            <AlertesCard
              alertes={filteredAlertes}
              onAlertClick={(alert) => go(alert.target.view, alert.target.id ? { id: alert.target.id } : undefined)}
            />
          )}

        </div>
        )}
      </div>
      )}
    </div>
  );
}
