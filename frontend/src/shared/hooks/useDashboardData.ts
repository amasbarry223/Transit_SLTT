"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { logWarn } from "@/shared/logger";
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
  type TransitStats,
  type CashFlowStats,
  type InvoiceStats,
  type ReceivableStats,
  type TransitPipelineStep,
  type OperationalAlert,
  type WarehouseStats,
  type RecentOperation,
  type TransitPerformanceKPI,
} from "@/mock/dashboard";

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

export function useDashboardData() {
  const [data, setData] = useState<DashboardAnalyticsData>({
    kpis: MOCK_DASHBOARD_KPIS,
    transitStats: MOCK_TRANSIT_STATS,
    cashFlowStats: MOCK_CASHFLOW_STATS,
    invoiceStats: MOCK_INVOICE_STATS,
    receivableStats: MOCK_RECEIVABLE_STATS,
    pipeline: MOCK_TRANSIT_PIPELINE,
    operationalAlerts: MOCK_OPERATIONAL_ALERTS,
    warehouseStats: MOCK_WAREHOUSE_STATS,
    recentOperations: MOCK_RECENT_OPERATIONS,
    transitPerformance: MOCK_TRANSIT_PERFORMANCE,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.dashboard.getAnalytics();
      if (res?.data) {
        const live = res.data;
        setData((prev) => ({
          ...prev,
          kpis: live.kpis || prev.kpis,
          transitStats: live.transitStats ? { ...prev.transitStats, ...live.transitStats } : prev.transitStats,
          cashFlowStats: live.cashFlowStats || prev.cashFlowStats,
          invoiceStats: live.invoiceStats || prev.invoiceStats,
          receivableStats: live.receivableStats || prev.receivableStats,
          operationalAlerts: live.operationalAlerts || prev.operationalAlerts,
          recentOperations: live.recentOperations || prev.recentOperations,
        }));
        setIsLive(true);
      }
    } catch (err) {
      logWarn("[useDashboardData] Chargement analytics depuis API", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    isLive,
    refetch: fetchDashboardData,
  };
}
