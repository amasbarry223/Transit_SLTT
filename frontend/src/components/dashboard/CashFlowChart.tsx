"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Coins, ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle, Clock } from "lucide-react";
import type { CashFlowStats } from "@/mock/dashboard";
import { formatFCFA } from "@/lib/format";

interface CashFlowChartProps {
  stats: CashFlowStats;
  isDark?: boolean;
}

export function CashFlowChart({ stats, isDark = false }: CashFlowChartProps) {
  const data = stats.monthlyHistory;
  const gridStroke = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor = isDark ? "#94A3B8" : "#64748B";

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <TrendingUp className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Évolution de la trésorerie
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Flux mensuels des encaissements et décaissements de caisse/banque (6 derniers mois)
          </p>
        </div>

        <div
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border self-start sm:self-auto ${
            stats.variationMois >= 0
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40"
              : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40"
          }`}
        >
          {stats.variationMois >= 0 ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          <span>
            {stats.variationMois >= 0 ? "+" : ""}
            {stats.variationMois}% vs mois dernier
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Graphique Recharts (col 8 sur lg) */}
        <div className="lg:col-span-8 h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis
                dataKey="monthShort"
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
                        <div key={`entry-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
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
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="entrees"
                name="Entrées"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 2, fill: "#FFFFFF" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="sorties"
                name="Sorties"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 2, fill: "#FFFFFF" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Panneau latéral : Solde actuel & Pression des Débours (col 4 sur lg) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3 h-full">
          {/* 1. Solde disponible */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-teal-500/10 to-teal-500/5 dark:from-teal-950/40 dark:to-teal-950/20 border border-teal-200/70 dark:border-teal-800/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 block mb-1">
              Solde disponible actuel
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatFCFA(stats.soldeDisponible)}
            </div>
            <p className="text-[11px] text-teal-600/80 dark:text-teal-400/80 mt-1 font-medium">
              Caisses Siège + Agence Abidjan + Banques
            </p>
          </div>

          {/* 2. Débours à récupérer (Pression financière) */}
          <div className="rounded-xl p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block mb-1">
                Débours à récupérer
              </span>
              <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-700 dark:text-rose-300 tracking-tight">
              {formatFCFA(stats.deboursARecuperer)}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Avances douane & port engagées pour les clients
            </p>
          </div>

          {/* 3. Bons en attente */}
          <div className="rounded-xl p-3 bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                Bons de caisse en attente
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatFCFA(stats.bonsEnAttente)}
              </span>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              <Clock className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
