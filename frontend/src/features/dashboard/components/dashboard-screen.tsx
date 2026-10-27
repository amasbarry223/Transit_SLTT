"use client";

import React, { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useNav } from "@/lib/nav-store";
import { useSession } from "@/lib/session/session-store";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { usePermission } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { SkeletonCard } from "@/shared/components/ui/skeleton";
import { ScreenSkeleton } from "@/components/sltt/screen-skeleton";

import {
  DashboardHeader,
  KPIGrid,
  TransitPipeline,
  OperationalAlerts,
  RecentOperations,
} from "@/components/dashboard";

// Lazy loading des graphiques Recharts pour alléger le bundle initial (~400KB)
const TransitActivityChart = dynamic(
  () => import("@/components/dashboard/TransitActivityChart").then((m) => m.TransitActivityChart),
  { loading: () => <SkeletonCard className="h-[340px]" /> },
);
const DossierStatusChart = dynamic(
  () => import("@/components/dashboard/DossierStatusChart").then((m) => m.DossierStatusChart),
  { loading: () => <SkeletonCard className="h-[340px]" /> },
);
const CashFlowChart = dynamic(
  () => import("@/components/dashboard/CashFlowChart").then((m) => m.CashFlowChart),
  { loading: () => <SkeletonCard className="h-[340px]" /> },
);
const RevenueChart = dynamic(
  () => import("@/components/dashboard/RevenueChart").then((m) => m.RevenueChart),
  { loading: () => <SkeletonCard className="h-[340px]" /> },
);
const ReceivablesChart = dynamic(
  () => import("@/components/dashboard/ReceivablesChart").then((m) => m.ReceivablesChart),
  { loading: () => <SkeletonCard className="h-[340px]" /> },
);

import { useDashboardData } from "@/shared/hooks/useDashboardData";
import {
  type OperationalAlert,
  type RecentOperation,
} from "@/types/dashboard";

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const openFactureDetail = useNav((s) => s.openFactureDetail);
  const currentUserName = useSession((s) => s.currentUserName);
  const canCreateDossier = usePermission("dossiers:write");
  const theme = useUiPrefs((s) => s.theme);
  const isDark = theme === "dark";

  // Récupération des données live de la base via l'API NestJS
  const { data: liveData, isLoading } = useDashboardData();

  const { annexes, selectedAnnexeId } = useActiveAnnexe();

  // Nom de l'annexe active
  const activeAnnexeName = useMemo(() => {
    if (!selectedAnnexeId || selectedAnnexeId === "all") {
      if (annexes.length > 0) {
        return `Toutes les annexes (${annexes.map((a) => a.nom || a.villeSiege).join(" & ")})`;
      }
      return "Toutes les annexes";
    }
    const found = annexes.find((a) => a.id === selectedAnnexeId);
    return found ? `${found.nom} (${found.villeSiege})` : "Toutes les annexes";
  }, [annexes, selectedAnnexeId]);

  // Actions de navigation mémoïsées
  const handleKpiClick = useCallback((targetView: string) => {
    if (targetView === "dossiers") go("dossiers");
    else if (targetView === "clients") go("clients");
    else if (targetView === "factures") go("factures");
    else if (targetView === "comptabilite") go("comptabilite");
    else if (targetView === "entreposage") go("entreposage");
  }, [go]);

  const handleOperationClick = useCallback((op: RecentOperation) => {
    // Si l'opération a un identifiant direct ou préfixé (ex: op-dos-123 ou op-fac-456)
    const rawId = op.targetId || op.id;
    const cleanId = rawId?.replace(/^op-(dos|fac)-/, "");

    if (op.type === "Dossier") {
      if (cleanId && cleanId !== rawId) {
        openDossierDetail(cleanId);
      } else {
        go("dossiers", { id: cleanId || null });
      }
    } else if (op.type === "Facture") {
      if (cleanId && cleanId !== rawId) {
        openFactureDetail(cleanId);
      } else {
        go("factures", { id: cleanId || null });
      }
    } else if (op.type === "Débours" || op.type === "Caisse") {
      go("comptabilite");
    } else if (op.type === "Stock") {
      go("entreposage");
    }
  }, [go, openDossierDetail, openFactureDetail]);

  const handleAlertClick = useCallback((alert: OperationalAlert) => {
    if (alert.targetId) {
      if (alert.targetView === "dossiers") {
        openDossierDetail(alert.targetId);
        return;
      }
      if (alert.targetView === "factures") {
        openFactureDetail(alert.targetId);
        return;
      }
    }

    if (alert.targetView === "dossiers") go("dossiers");
    else if (alert.targetView === "factures") go("factures");
    else if (alert.targetView === "comptabilite") go("comptabilite");
    else if (alert.targetView === "archives") go("archives");
    else go("dossiers");
  }, [go, openDossierDetail, openFactureDetail]);

  const scrollToAlerts = useCallback(() => {
    const el = document.getElementById("alertes-a-traiter");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleGoDossiers = useCallback(() => go("dossiers"), [go]);
  const handleGoFactures = useCallback(() => go("factures"), [go]);
  const handleGoClients = useCallback(() => go("clients"), [go]);
  const handleNewDossier = useCallback(() => openDossier(null, "create"), [openDossier]);

  if (isLoading) {
    return <ScreenSkeleton view="dashboard" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HERO / EN-TÊTE DASHBOARD */}
      <DashboardHeader
        userName={currentUserName}
        activeAnnexeName={activeAnnexeName}
        onNewDossier={handleNewDossier}
        onViewAlerts={scrollToAlerts}
        canCreateDossier={canCreateDossier}
        alertCount={liveData.operationalAlerts.length}
      />

      {/* 2. 6 KPI PRINCIPAUX DYNAMIQUES DEPUIS LA DB */}
      <KPIGrid kpis={liveData.kpis} onKpiClick={handleKpiClick} />

      {/* 3. ACTIVITÉ TRANSIT MENSUELLE (8 COLS) & RÉPARTITION STATUT DOUANE (4 COLS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-8">
          <TransitActivityChart stats={liveData.transitStats} isDark={isDark} />
        </div>
        <div className="lg:col-span-4">
          <DossierStatusChart
            stats={liveData.transitStats}
            onSelectStatus={handleGoDossiers}
          />
        </div>
      </div>

      {/* 4. PIPELINE HORIZONTAL DU CORRIDOR DE TRANSIT (12 COLS) */}
      <TransitPipeline
        steps={liveData.pipeline}
        onSelectStep={handleGoDossiers}
      />

      {/* 5. TRÉSORERIE & FLUX DE DÉBOURS (12 COLS - GRAPHIQUE + INDICATEURS AVANCES DOUANE) */}
      <CashFlowChart stats={liveData.cashFlowStats} isDark={isDark} />

      {/* 6. FACTURATION (6 COLS) & CRÉANCES CLIENTS / RECOUVREMENT (6 COLS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-6">
          <RevenueChart stats={liveData.invoiceStats} isDark={isDark} />
        </div>
        <div className="lg:col-span-6">
          <ReceivablesChart
            stats={liveData.receivableStats}
            isDark={isDark}
            onGoToFactures={handleGoFactures}
            onSelectClient={handleGoClients}
          />
        </div>
      </div>

      {/* 7. OPÉRATIONS RÉCENTES (8 COLS) & ALERTES OPÉRATIONNELLES ET DOUANE (4 COLS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-8">
          <RecentOperations
            operations={liveData.recentOperations}
            onSelectOperation={handleOperationClick}
            onViewAll={handleGoDossiers}
          />
        </div>
        <div id="alertes-a-traiter" className="lg:col-span-4">
          <OperationalAlerts
            alerts={liveData.operationalAlerts}
            onAlertClick={handleAlertClick}
          />
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
