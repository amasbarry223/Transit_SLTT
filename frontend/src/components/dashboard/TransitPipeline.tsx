"use client";

import React from "react";
import { ArrowRight, AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { TransitPipelineStep } from "@/mock/dashboard";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/shared/utils/cn";

interface TransitPipelineProps {
  steps: TransitPipelineStep[];
  onSelectStep?: (stepKey: string) => void;
}

export function TransitPipeline({ steps, onSelectStep }: TransitPipelineProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Pipeline des dossiers de transit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi du workflow de dédouanement et des débours financiers engagés par étape
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="size-3.5 text-slate-400" />
          <span>Mise à jour en direct</span>
        </div>
      </div>

      {/* Grille horizontale du pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.stepKey}
              onClick={() => onSelectStep?.(step.stepKey)}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl p-3 border transition-all cursor-pointer",
                step.hasOverdueAlert
                  ? "border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70"
                  : "border-slate-200/80 dark:border-border/60 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 hover:border-blue-300 shadow-2xs"
              )}
            >
              {/* Entête de l'étape : index et alerte éventuelle */}
              <div className="flex items-center justify-between mb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {idx + 1}
                </span>

                {step.hasOverdueAlert && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[9px] font-bold animate-pulse">
                    <AlertCircle className="size-2.5" />
                    {step.overdueCount} bloqués
                  </span>
                )}
              </div>

              {/* Libellé & Nombre */}
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {step.label}
                </span>

                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {step.count}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    ({step.percentage}%)
                  </span>
                </div>
              </div>

              {/* Montant débours engagé */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Débours engagés
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                  {step.deboursEngages > 0 ? formatFCFA(step.deboursEngages) : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
