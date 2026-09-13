"use client";

import React, { useMemo } from "react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session/session-store";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { useCurrentUser, usePermission } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { formatFCFA } from "@/lib/format";

import {
  DashboardHeader,
  KPIGrid,
  TransitActivityChart,
  DossierStatusChart,
  QuickActions,
  CashFlowChart,
  RevenueChart,
  ReceivablesChart,
  TransitPipeline,
  OperationalAlerts,
  WarehouseOverview,
  RecentOperations,
  TransitPerformance,
  CorridorTrackingMap,
} from "@/components/dashboard";

import {
  MOCK_DASHBOARD_KPIS,
  MOCK_TRANSIT_STATS,
  MOCK_CASHFLOW_STATS,
  MOCK_INVOICE_STATS,
  MOCK_RECEIVABLE_STATS,
  MOCK_TRANSIT_PIPELINE,
  MOCK_OPERATIONAL_ALERTS,
  MOCK_WAREHOUSE_STATS,
  MOCK_RECENT_OPERATIONS,
  MOCK_TRANSIT_PERFORMANCE,
  type DashboardKPI,
  type OperationalAlert,
  type RecentOperation,
} from "@/mock/dashboard";

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const currentUserName = useSession((s) => s.currentUserName);
  const canCreateDossier = usePermission("dossiers:write");
  const theme = useUiPrefs((s) => s.theme);
  const isDark = theme === "dark";

  // Récupération des données du store Zustand pour enrichissement dynamique
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const stock = useStore((s) => s.stock);
  const clients = useStore((s) => s.clients);
  const { annexes, selectedAnnexeId } = useActiveAnnexe();
  const currentUser = useCurrentUser();

  // Nom de l'annexe active
  const activeAnnexeName = useMemo(() => {
    if (!selectedAnnexeId || selectedAnnexeId === "all") {
      return "Toutes les annexes (Siège Bamako & Abidjan)";
    }
    const found = annexes.find((a) => a.id === selectedAnnexeId);
    return found ? `${found.nom} (${found.villeSiege})` : "Toutes les annexes";
  }, [annexes, selectedAnnexeId]);

  // Enrichissement dynamique des KPI si données réelles existantes
  const enrichedKPIs = useMemo<DashboardKPI[]>(() => {
    return MOCK_DASHBOARD_KPIS.map((kpi) => {
      if (kpi.type === "dossiers_total" && dossiers.length > 0) {
        return {
          ...kpi,
          rawNumericValue: dossiers.length,
          formattedValue: `${dossiers.length}`,
        };
      }
      if (kpi.type === "dossiers_en_cours" && dossiers.length > 0) {
        const enCoursCount = dossiers.filter(
          (d) => d.statut !== "Soldé" && (d.statut as string) !== "CLOTURE" && (d.statut as string) !== "Livré"
        ).length;
        return {
          ...kpi,
          rawNumericValue: enCoursCount,
          formattedValue: `${enCoursCount}`,
          subtitle: `dont ${Math.min(enCoursCount, 8)} en attente douane`,
        };
      }
      if (kpi.type === "clients_actifs" && clients.length > 0) {
        return {
          ...kpi,
          rawNumericValue: clients.length,
          formattedValue: `${clients.length}`,
        };
      }
      if (kpi.type === "factures_recouvrer" && factures.length > 0) {
        const totalImpaye = factures
          .filter((f) => f.statut !== "Soldée" && f.statut !== "Annulée")
          .reduce((sum, f) => sum + (f.montantTTC - (f.montantPaye || 0)), 0);
        if (totalImpaye > 0) {
          return {
            ...kpi,
            rawNumericValue: totalImpaye,
            formattedValue: formatFCFA(totalImpaye),
          };
        }
      }
      return kpi;
    });
  }, [dossiers, clients, factures]);

  // Actions de navigation
  const handleKpiClick = (targetView: string) => {
    if (targetView === "dossiers") go("dossiers");
    else if (targetView === "clients") go("clients");
    else if (targetView === "factures") go("factures");
    else if (targetView === "comptabilite") go("comptabilite");
    else if (targetView === "entreposage") go("entreposage");
  };

  const handleQuickAction = (key: string) => {
    switch (key) {
      case "nouveau-dossier":
        openDossier(null, "create");
        break;
      case "nouveau-debours":
        go("comptabilite", { comptaTab: "journal" });
        break;
      case "nouvelle-facture":
        go("factures");
        break;
      case "nouveau-devis":
        go("devis");
        break;
      case "gestion-stock":
        go("entreposage");
        break;
      case "comptabilite":
        go("comptabilite");
        break;
      default:
        break;
    }
  };

  const handleAlertClick = (alert: OperationalAlert) => {
    if (alert.targetView === "dossiers") go("dossiers");
    else if (alert.targetView === "factures") go("factures");
    else if (alert.targetView === "comptabilite") go("comptabilite");
    else if (alert.targetView === "archives") go("archives");
  };

  const handleOperationClick = (op: RecentOperation) => {
    if (op.targetView === "dossiers") go("dossiers");
    else if (op.targetView === "factures") go("factures");
    else if (op.targetView === "comptabilite") go("comptabilite");
    else if (op.targetView === "entreposage") go("entreposage");
  };

  const scrollToAlerts = () => {
    const el = document.getElementById("alertes-a-traiter");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HERO / EN-TÊTE DASHBOARD */}
      <DashboardHeader
        userName={currentUserName}
        activeAnnexeName={activeAnnexeName}
        onNewDossier={() => openDossier(null, "create")}
        onViewAlerts={scrollToAlerts}
        canCreateDossier={canCreateDossier}
        alertCount={MOCK_OPERATIONAL_ALERTS.length}
      />

      {/* 2. 6 KPI PRINCIPAUX */}
      <KPIGrid kpis={enrichedKPIs} onKpiClick={handleKpiClick} />

      {/* 3. GRAPHIQUE PRINCIPAL & RÉPARTITION STATUT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-8">
          <TransitActivityChart stats={MOCK_TRANSIT_STATS} isDark={isDark} />
        </div>
        <div className="lg:col-span-4">
          <DossierStatusChart
            stats={MOCK_TRANSIT_STATS}
            onSelectStatus={() => go("dossiers")}
          />
        </div>
      </div>

      {/* 4. PIPELINE HORIZONTAL DES DOSSIERS DE TRANSIT */}
      <TransitPipeline
        steps={MOCK_TRANSIT_PIPELINE}
        onSelectStep={() => go("dossiers")}
      />

      {/* 5. TRÉSORERIE & ACTIONS RAPIDES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-8">
          <CashFlowChart stats={MOCK_CASHFLOW_STATS} isDark={isDark} />
        </div>
        <div className="lg:col-span-4">
          <QuickActions onAction={handleQuickAction} />
        </div>
      </div>

      {/* 6. FACTURATION & CRÉANCES CLIENTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-6">
          <RevenueChart stats={MOCK_INVOICE_STATS} isDark={isDark} />
        </div>
        <div className="lg:col-span-6">
          <ReceivablesChart
            stats={MOCK_RECEIVABLE_STATS}
            isDark={isDark}
            onGoToFactures={() => go("factures")}
            onSelectClient={() => go("clients")}
          />
        </div>
      </div>

      {/* 7. OPÉRATIONS RÉCENTES, STOCKS ET ALERTES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Dernières opérations (5 cols) */}
        <div className="lg:col-span-5">
          <RecentOperations
            operations={MOCK_RECENT_OPERATIONS}
            onSelectOperation={handleOperationClick}
            onViewAll={() => go("dossiers")}
          />
        </div>

        {/* Occupation des entrepôts (4 cols) */}
        <div className="lg:col-span-4">
          <WarehouseOverview
            stats={MOCK_WAREHOUSE_STATS}
            onGoToWarehouse={() => go("entreposage")}
          />
        </div>

        {/* Alertes à traiter (3 cols) */}
        <div id="alertes-a-traiter" className="lg:col-span-3">
          <OperationalAlerts
            alerts={MOCK_OPERATIONAL_ALERTS}
            onAlertClick={handleAlertClick}
          />
        </div>
      </div>

      {/* 8. PERFORMANCE DOUANIÈRE & SUIVI GÉOGRAPHIQUE DU CORRIDOR */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-6">
          <TransitPerformance
            performance={MOCK_TRANSIT_PERFORMANCE}
            onViewDossiersBloques={() => go("dossiers")}
            onViewConteneurs={() => go("dossiers")}
          />
        </div>
        <div className="lg:col-span-6">
          <CorridorTrackingMap />
        </div>
      </div>

      {/* FOOTER INSTITUTIONNEL */}
      <div className="rounded-xl border border-slate-200/60 dark:border-border/60 bg-slate-50/50 dark:bg-card/40 p-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            SLTT — Société Logistique Transit Transport
          </span>
          <span>·</span>
          <span>Commissionnaire Agréé en Douane (Mali ↔ Côte d&apos;Ivoire)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Réglementation fiscale UEMOA & SYSCOHADA : Les débours de douane sont refacturés au centime sans TVA ni marge.
        </p>
      </div>
    </div>
  );
}
