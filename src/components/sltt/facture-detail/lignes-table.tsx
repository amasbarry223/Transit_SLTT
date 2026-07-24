"use client";

import { FileText } from "lucide-react";
import type { Facture } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LignesTable({ lignes }: { lignes: Facture["lignes"] }) {
  if (lignes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <FileText className="size-8 text-slate-200 dark:text-slate-700" />
        <p className="mt-2 text-sm text-slate-400">Aucune ligne de facturation</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 p-4 sm:hidden">
        {lignes.map((l) => (
          <div key={l.id} className="rounded-lg border border-border/60 p-3">
            <p className="font-medium text-slate-800 dark:text-slate-200">{l.description}</p>
            <dl className="mt-1.5 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Qté × P.U. HT</dt>
                <dd className="tabular-nums text-slate-600 dark:text-slate-300">{l.quantite} × {formatFCFA(l.prixUnitaire)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Total HT</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatFCFA(l.montantHT)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-slate-50/80 dark:bg-slate-800/50">
              <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Description
              </th>
              <th className="w-16 px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Qté
              </th>
              <th className="w-32 px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                P.U. HT
              </th>
              <th className="w-36 px-5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Total HT
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {lignes.map((l, i) => (
              <tr key={l.id} className={cn(i % 2 === 1 && "bg-slate-50/40 dark:bg-slate-800/20")}>
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{l.description}</td>
                <td className="px-3 py-3 text-center tabular-nums text-slate-500">{l.quantite}</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {formatFCFA(l.prixUnitaire)}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatFCFA(l.montantHT)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
