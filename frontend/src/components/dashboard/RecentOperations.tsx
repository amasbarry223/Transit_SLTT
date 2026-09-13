"use client";

import React from "react";
import { Clock, ExternalLink, Ship, Receipt, Wallet, Warehouse, FileText } from "lucide-react";
import type { RecentOperation } from "@/mock/dashboard";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/shared/utils/cn";

interface RecentOperationsProps {
  operations: RecentOperation[];
  onSelectOperation?: (op: RecentOperation) => void;
  onViewAll?: () => void;
}

const TYPE_ICON_MAP = {
  Dossier: Ship,
  Facture: Receipt,
  Débours: Wallet,
  Caisse: Wallet,
  Stock: Warehouse,
};

const STATUT_COLOR_MAP = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
  slate: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

export function RecentOperations({ operations, onSelectOperation, onViewAll }: RecentOperationsProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Clock className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Dernières opérations
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Journal d&apos;activité récent tous modules confondus
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Voir tout</span>
            <ExternalLink className="size-3.5" />
          </button>
        )}
      </div>

      {/* Table responsive */}
      <div className="overflow-x-auto -mx-5 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-5 sm:px-0">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            <thead>
              <tr className="text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Type</th>
                <th className="pb-2.5">Référence</th>
                <th className="pb-2.5">Client / Objet</th>
                <th className="pb-2.5 text-right">Montant</th>
                <th className="pb-2.5 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {operations.map((op) => {
                const Icon = TYPE_ICON_MAP[op.type] || FileText;
                const badgeStyle = STATUT_COLOR_MAP[op.statutColor] || STATUT_COLOR_MAP.slate;

                return (
                  <tr
                    key={op.id}
                    onClick={() => onSelectOperation?.(op)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-medium text-slate-500 whitespace-nowrap">
                      {op.formattedDate}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Icon className="size-3.5 text-slate-400" />
                        {op.type}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {op.reference}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 truncate max-w-[160px] sm:max-w-[220px]">
                      {op.clientOuTiers}
                    </td>
                    <td className="py-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {op.montant ? formatFCFA(op.montant) : "—"}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          badgeStyle
                        )}
                      >
                        {op.statut}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
