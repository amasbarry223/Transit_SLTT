"use client";

import React from "react";
import {
  Ship,
  Truck,
  Users,
  Receipt,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { DashboardKPI } from "@/mock/dashboard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";

interface KPIGridProps {
  kpis: DashboardKPI[];
  onKpiClick: (targetView: string) => void;
}

const ICON_MAP = {
  dossiers_total: Ship,
  dossiers_en_cours: Truck,
  clients_actifs: Users,
  factures_recouvrer: Receipt,
  debours_avances: Wallet,
  tresorerie_disponible: Coins,
};

const COLOR_CONFIG = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200/70 dark:border-blue-800/40",
    iconBg: "bg-blue-600 text-white",
    textAccent: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200/70 dark:border-emerald-800/40",
    iconBg: "bg-emerald-600 text-white",
    textAccent: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200/70 dark:border-purple-800/40",
    iconBg: "bg-purple-600 text-white",
    textAccent: "text-purple-700 dark:text-purple-300",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200/70 dark:border-amber-800/40",
    iconBg: "bg-amber-600 text-white",
    textAccent: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200/70 dark:border-rose-800/40",
    iconBg: "bg-rose-600 text-white",
    textAccent: "text-rose-700 dark:text-rose-300",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200/70 dark:border-teal-800/40",
    iconBg: "bg-teal-600 text-white",
    textAccent: "text-teal-700 dark:text-teal-300",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200",
  },
};

export function KPIGrid({ kpis, onKpiClick }: KPIGridProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = ICON_MAP[kpi.type] || Ship;
          const colors = COLOR_CONFIG[kpi.accentColor] || COLOR_CONFIG.blue;

          return (
            <div
              key={kpi.id}
              onClick={() => onKpiClick(kpi.targetView)}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-card border border-slate-200/80 dark:border-border/70 shadow-xs",
                "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer overflow-hidden"
              )}
            >
              {/* En-tête de la carte : Icône + variation */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105",
                    colors.iconBg
                  )}
                >
                  <Icon className="size-5" />
                </div>

                {kpi.variation && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      kpi.variation.isPositive
                        ? "bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-rose-100/90 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    )}
                  >
                    {kpi.variation.isPositive ? (
                      <ArrowUpRight className="size-3 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="size-3 stroke-[2.5]" />
                    )}
                    {kpi.variation.percentage > 0 ? `+${kpi.variation.percentage}%` : `${kpi.variation.percentage}%`}
                  </span>
                )}

                {kpi.isFinancialDebours && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.5 text-[10px] font-bold">
                        <Info className="size-3" />
                        0% TVA
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs font-normal">
                      Avances de trésorerie décaissées pour le compte des clients (droits de douane, B/L fees). Refacturées à l&apos;identique, ne constituent aucun chiffre d&apos;affaires.
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Contenu : Libellé & Valeur principale */}
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight block">
                  {kpi.label}
                </span>

                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {kpi.formattedValue}
                  </span>
                </div>

                {/* Sous-titre ou précision réglementaire */}
                {kpi.subtitle && (
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {kpi.subtitle}
                  </p>
                )}
              </div>

              {/* Ligne discrète de progression ou d'état au hover */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  colors.iconBg
                )}
              />
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
