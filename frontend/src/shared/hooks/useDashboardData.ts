"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { logWarn } from "@/shared/logger";
import type {
  DashboardKPI,
  TransitStats,
  CashFlowStats,
  InvoiceStats,
  ReceivableStats,
  TransitPipelineStep,
  OperationalAlert,
  WarehouseStats,
  RecentOperation,
  TransitPerformanceKPI,
} from "@/types/dashboard";

export interface DashboardAnalyticsData {
  kpis: DashboardKPI[];
  transitStats: TransitStats;
  cashFlowStats: CashFlowStats;
  invoiceStats: InvoiceStats;
  receivableStats: ReceivableStats;
  pipeline: TransitPipelineStep[];
  operationalAlerts: OperationalAlert[];
  warehouseStats: WarehouseStats;
  recentOperations: RecentOperation[];
  transitPerformance: TransitPerformanceKPI;
}

const EMPTY_DASHBOARD_DATA: DashboardAnalyticsData = {
  kpis: [],
  transitStats: {
    totalDossiersCount: 0,
    statusDistribution: [],
    period7Days: [],
    period30Days: [],
    period90Days: [],
  },
  cashFlowStats: {
    soldeDisponible: 0,
    deboursARecuperer: 0,
    bonsEnAttente: 0,
    variationMois: 0,
    monthlyHistory: [],
  },
  invoiceStats: {
    summary: {
      prestationsHT: 0,
      tvaCollectee: 0,
      deboursRefactures: 0,
      totalFactureTTC: 0,
      variationPrestations: 0,
    },
    monthlyHistory: [],
  },
  receivableStats: {
    totalARecouvrer: 0,
    montantEchu: 0,
    montantNonEchu: 0,
    agingBalance: [],
    topRiskClients: [],
  },
  pipeline: [],
  operationalAlerts: [],
  warehouseStats: {
    capaciteTotaleM3: 0,
    capaciteUtiliseeM3: 0,
    capaciteDisponibleM3: 0,
    tauxOccupation: 0,
    categories: [],
  },
  recentOperations: [],
  transitPerformance: {
    delaiMoyenDedouanementJours: 0,
    tauxDossiersLivresATemps: 100,
    dossiersBloques: 0,
    conteneursEnTransit: 0,
    trend: { delaiTrend: 0, livraisonTrend: 0 },
  },
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardAnalyticsData>(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.dashboard.getAnalytics();
      if (res?.data) {
        const live = res.data as Partial<DashboardAnalyticsData>;
        setData({
          kpis: Array.isArray(live.kpis) ? live.kpis : [],
          transitStats: live.transitStats
            ? { ...EMPTY_DASHBOARD_DATA.transitStats, ...live.transitStats }
            : EMPTY_DASHBOARD_DATA.transitStats,
          cashFlowStats: live.cashFlowStats
            ? { ...EMPTY_DASHBOARD_DATA.cashFlowStats, ...live.cashFlowStats }
            : EMPTY_DASHBOARD_DATA.cashFlowStats,
          invoiceStats: live.invoiceStats
            ? { ...EMPTY_DASHBOARD_DATA.invoiceStats, ...live.invoiceStats }
            : EMPTY_DASHBOARD_DATA.invoiceStats,
          receivableStats: live.receivableStats
            ? { ...EMPTY_DASHBOARD_DATA.receivableStats, ...live.receivableStats }
            : EMPTY_DASHBOARD_DATA.receivableStats,
          pipeline: Array.isArray(live.pipeline) ? live.pipeline : [],
          operationalAlerts: Array.isArray(live.operationalAlerts) ? live.operationalAlerts : [],
          warehouseStats: live.warehouseStats || EMPTY_DASHBOARD_DATA.warehouseStats,
          recentOperations: Array.isArray(live.recentOperations) ? live.recentOperations : [],
          transitPerformance: live.transitPerformance || EMPTY_DASHBOARD_DATA.transitPerformance,
        });
        setIsLive(true);
      }
    } catch (err) {
      logWarn("[useDashboardData] Chargement analytics depuis API", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- charge les analytics live depuis le serveur au montage
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    isLive,
    refetch: fetchDashboardData,
  };
}
