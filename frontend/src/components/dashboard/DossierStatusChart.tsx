"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Layers } from "lucide-react";
import type { TransitStats } from "@/mock/dashboard";

interface DossierStatusChartProps {
  stats: TransitStats;
  onSelectStatus?: (statusKey: string) => void;
}

export function DossierStatusChart({ stats, onSelectStatus }: DossierStatusChartProps) {
  const data = stats.statusDistribution;
  const total = stats.totalDossiersCount;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Layers className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Répartition des dossiers
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ventilation active par phase de dédouanement
          </p>
        </div>
      </div>

      {/* Zone du Donut Chart avec le Total au centre */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <div className="relative w-48 h-48 sm:w-52 sm:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-lg backdrop-blur-xs text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                        <span>Nombre :</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.value} dossiers</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                        <span>Part :</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.percentage}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => onSelectStatus?.(entry.key)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Badge central du total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {total}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total
            </span>
          </div>
        </div>
      </div>

      {/* Liste détaillée des statuts avec pourcentages & quantités */}
      <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        {data.map((item) => (
          <div
            key={item.name}
            onClick={() => onSelectStatus?.(item.key)}
            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-right shrink-0">
              <span className="font-bold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
              <span className="text-slate-400 font-normal">({item.value})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
