"use client";

import { formatFCFA } from "@/lib/format";
import { shouldShowTva } from "@/lib/export";
import { cn } from "@/lib/utils";

export function FinancialSummary({
  montantHT,
  tauxTVA,
  montantTVA,
  montantTTC,
  montantPaye,
  editMode,
  editMontantHT,
  editTVA,
  editTTC,
}: {
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  editMode?: boolean;
  editMontantHT?: number;
  editTVA?: number;
  editTTC?: number;
}) {
  const ht = editMode ? (editMontantHT ?? 0) : montantHT;
  const tva = editMode ? (editTVA ?? 0) : tauxTVA;
  const tvaAmt = editMode ? Math.round(ht * (tva / 100)) : montantTVA;
  const ttc = editMode ? (editTTC ?? 0) : montantTTC;
  const reste = Math.max(0, ttc - montantPaye);

  return (
    <div className="space-y-2 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Sous-total HT</span>
        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(ht)}</span>
      </div>
      {shouldShowTva(tva) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">TVA {tva}%</span>
          <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(tvaAmt)}</span>
        </div>
      )}
      <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3">
        <span className="text-sm font-bold text-white">Total TTC</span>
        <span className="text-lg font-extrabold tabular-nums text-white">{formatFCFA(ttc)}</span>
      </div>
      {!editMode && montantPaye > 0 && (
        <>
          <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400">
            <span>Déjà payé</span>
            <span className="font-semibold tabular-nums">- {formatFCFA(montantPaye)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-2 text-sm font-bold">
            <span className="text-slate-700 dark:text-slate-300">Reste à payer</span>
            <span className={cn("tabular-nums", reste > 0 ? "text-amber-700" : "text-emerald-600")}>
              {formatFCFA(reste)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
