"use client";

import { CheckCircle2 } from "lucide-react";
import type { FactureStatut } from "@/lib/store";
import { cn } from "@/lib/utils";
import { canTransitionFacture, FACTURE_ALLOWED_TRANSITIONS } from "@/lib/status-flow";
import { STATUT_CONFIG, STATUT_FLOW } from "./facture-statut-config";

export function VerticalStepper({
  statut,
  onSelect,
  canWrite,
}: {
  statut: FactureStatut;
  onSelect: (s: FactureStatut) => void;
  canWrite: boolean;
}) {
  if (statut === "Annulée") {
    const cfg = STATUT_CONFIG.Annulée;
    const Icon = cfg.icon;
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950/40">
        <Icon className="size-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">Annulée</p>
          <p className="text-xs opacity-70">{cfg.desc}</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUT_FLOW.indexOf(statut);
  const allowedNext = FACTURE_ALLOWED_TRANSITIONS[statut] ?? [];

  return (
    <div>
      {STATUT_FLOW.map((s, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        // "Partielle" ne s'atteint que via un paiement réel (recordFacturePaiement),
        // jamais par un clic manuel sur le pipeline.
        const clickable = canWrite && !done && !current && s !== "Partielle" && allowedNext.includes(s);
        const cfg = STATUT_CONFIG[s];
        const Icon = cfg.icon;
        const isLast = idx === STATUT_FLOW.length - 1;

        return (
          <div key={s} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <button
                onClick={() => clickable && onSelect(s)}
                disabled={!clickable}
                title={clickable ? `Passer à ${s}` : s}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  done
                    ? "cursor-default border-emerald-500 bg-emerald-500 text-white"
                    : current
                      ? "cursor-default border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950"
                      : clickable
                        ? "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700",
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}
              </button>
              {!isLast && (
                <div
                  className={cn(
                    "min-h-[28px] w-0.5 flex-1",
                    done ? "bg-emerald-200" : "bg-slate-100 dark:bg-slate-800",
                  )}
                />
              )}
            </div>
            <div className={cn("pt-1.5", !isLast && "pb-5")}>
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  current
                    ? "text-blue-700"
                    : done
                      ? "text-emerald-700"
                      : "text-slate-400 dark:text-slate-500",
                )}
              >
                {s}
                {current && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    Actuel
                  </span>
                )}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs leading-relaxed",
                  current
                    ? "text-blue-500"
                    : done
                      ? "text-emerald-500"
                      : "text-slate-300 dark:text-slate-600",
                )}
              >
                {cfg.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
