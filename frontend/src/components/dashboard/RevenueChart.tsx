"use client";

import React from "react";
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
import { Receipt, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { InvoiceStats } from "@/mock/dashboard";
import { formatFCFA } from "@/lib/format";

interface RevenueChartProps {
  stats: InvoiceStats;
  isDark?: boolean;
}

export function RevenueChart({ stats, isDark = false }: RevenueChartProps) {
  const data = stats.monthlyHistory;
  const summary = stats.summary;
  const gridStroke = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor = isDark ? "#94A3B8" : "#64748B";

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <Receipt className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Facturation & revenus
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ségrégation stricte du Chiffre d&apos;Affaires (Prestations) et des Débours refacturés
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          <ShieldAlert className="size-3.5 text-amber-500" />
          <span>Débours 0% TVA (Refacturation à l&apos;identique)</span>
        </div>
      </div>

      {/* Cartes de synthèse financière */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* 1. CA Prestations HT */}
        <div className="rounded-xl p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
            Prestations HT (CA Réel)
          </span>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 block">
            {formatFCFA(summary.prestationsHT)}
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            Honoraires & Transit
          </span>
        </div>

        {/* 2. TVA Collectée */}
        <div className="rounded-xl p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
            TVA Collectée (18%)
          </span>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 block">
            {formatFCFA(summary.tvaCollectee)}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Reversement État
          </span>
        </div>

        {/* 3. Débours refacturés */}
        <div className="rounded-xl p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
            Débours refacturés
          </span>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 block">
            {formatFCFA(summary.deboursRefactures)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Douane & Port (0% TVA)
          </span>
        </div>

        {/* 4. Total Facturé TTC */}
        <div className="rounded-xl p-3 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Total Facturé TTC
          </span>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 block">
            {formatFCFA(summary.totalFactureTTC)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Prestations + TVA + Débours
          </span>
        </div>
      </div>

      {/* Graphique Recharts */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 10 }}
              tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg backdrop-blur-xs text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-2">{label}</p>
                    {payload.map((entry, idx) => (
                      <div key={`rev-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          {entry.name} :
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatFCFA(Number(entry.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
            />
            <Bar
              dataKey="prestationsHT"
              name="Prestations HT (CA)"
              fill="#2563EB"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="tvaCollectee"
              name="TVA Collectée"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="deboursRefactures"
              name="Débours Refacturés (0%)"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
