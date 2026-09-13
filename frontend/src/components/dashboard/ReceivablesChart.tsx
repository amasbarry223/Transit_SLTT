"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertTriangle, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import type { ReceivableStats } from "@/mock/dashboard";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/shared/utils/cn";

interface ReceivablesChartProps {
  stats: ReceivableStats;
  isDark?: boolean;
  onGoToFactures?: () => void;
  onSelectClient?: (clientId: string) => void;
}

export function ReceivablesChart({
  stats,
  isDark = false,
  onGoToFactures,
  onSelectClient,
}: ReceivablesChartProps) {
  const agingData = stats.agingBalance;
  const gridStroke = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor = isDark ? "#94A3B8" : "#64748B";

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertTriangle className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Créances clients & balance âgée
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ventilation des montants restant à recouvrer par tranche d&apos;ancienneté
          </p>
        </div>

        {onGoToFactures && (
          <button
            type="button"
            onClick={onGoToFactures}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto"
          >
            <span>Voir toutes les factures</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>

      {/* 3 mini KPI de créances */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total à recouvrer
          </span>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 block">
            {formatFCFA(stats.totalARecouvrer)}
          </span>
        </div>
        <div className="rounded-xl p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
            Non échu (0-30j)
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">
            {formatFCFA(stats.montantNonEchu)}
          </span>
        </div>
        <div className="rounded-xl p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
            Échu (&gt; 30j)
          </span>
          <span className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-300 mt-0.5 block">
            {formatFCFA(stats.montantEchu)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Graphique de balance âgée horizontal (col 6) */}
        <div className="lg:col-span-6 h-56 w-full">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
            Balance âgée par tranche
          </span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={agingData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fill: axisColor, fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
              />
              <YAxis
                type="category"
                dataKey="bracket"
                tickLine={false}
                axisLine={false}
                tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-lg text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        {formatFCFA(item.montant)} ({item.count} factures)
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
                {agingData.map((entry, index) => (
                  <Cell key={`cell-aging-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau : Top clients à risque (col 6) */}
        <div className="lg:col-span-6 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Top clients à risque & échéances dépassées
          </span>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden">
            {stats.topRiskClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onSelectClient?.(client.id)}
                className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                    {client.clientNom}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {client.referenceDossierOuFacture} · Échéance {client.echeance}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {formatFCFA(client.montant)}
                  </span>
                  <span
                    className={cn(
                      "inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-sm",
                      client.statut === "En retard"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : client.statut === "À risque"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    )}
                  >
                    {client.statut} (+{client.joursRetard}j)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
