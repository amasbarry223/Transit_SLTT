"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Ship, Truck, Plane, Calendar } from "lucide-react";
import type { TransitStats, TransitActivityDataPoint } from "@/mock/dashboard";
import { cn } from "@/shared/utils/cn";

interface TransitActivityChartProps {
  stats: TransitStats;
  isDark?: boolean;
}

export function TransitActivityChart({ stats, isDark = false }: TransitActivityChartProps) {
  const [period, setPeriod] = useState<"7j" | "30j" | "90j">("30j");

  const currentData: TransitActivityDataPoint[] =
    period === "7j"
      ? stats.period7Days
      : period === "90j"
      ? stats.period90Days
      : stats.period30Days;

  // Calculs de synthèse sur la période sélectionnée
  const totalMaritime = currentData.reduce((acc, d) => acc + d.maritime, 0);
  const totalTerrestre = currentData.reduce((acc, d) => acc + d.terrestre, 0);
  const totalAerien = currentData.reduce((acc, d) => acc + d.aerien, 0);
  const grandTotal = totalMaritime + totalTerrestre + totalAerien;

  const gridStroke = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor = isDark ? "#94A3B8" : "#64748B";

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête : Titres et Filtre de période */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Ship className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Évolution des opérations de transit
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Nombre de dossiers traités par mode de transport ({period === "7j" ? "7 derniers jours" : period === "90j" ? "3 derniers mois" : "30 derniers jours"})
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 self-start sm:self-auto">
          {(["7j", "30j", "90j"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                period === p
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {p === "7j" ? "7 jours" : p === "30j" ? "30 jours" : "90 jours"}
            </button>
          ))}
        </div>
      </div>

      {/* Mini résumé des totaux par mode */}
      <div className="grid grid-cols-4 gap-2 mb-4 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Total</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{grandTotal}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#2563EB]" />
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Maritime</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalMaritime}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#10B981]" />
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Terrestre</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalTerrestre}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#F59E0B]" />
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Aérien</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalAerien}</span>
          </div>
        </div>
      </div>

      {/* Zone du graphique Recharts */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barCategoryGap={period === "7j" ? "25%" : "15%"}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const totalItem = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg backdrop-blur-xs text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">{label}</p>
                    <div className="space-y-1">
                      {payload.map((entry, idx) => (
                        <div key={`tooltip-${idx}`} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name} :
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {entry.value} dossiers
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 flex justify-between font-bold text-slate-900 dark:text-white">
                        <span>Total :</span>
                        <span>{totalItem} dossiers</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            />
            <Bar
              dataKey="maritime"
              name="Maritime"
              stackId="transit"
              fill="#2563EB"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="terrestre"
              name="Terrestre"
              stackId="transit"
              fill="#10B981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="aerien"
              name="Aérien"
              stackId="transit"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
