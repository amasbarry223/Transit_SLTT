"use client";

import type { Devis } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FinancialBreakdown({ devis }: { devis: Devis }) {
  const items = [
    { label: "Droits de douane",  value: devis.droitDouane,    bar: "bg-blue-500",   text: "text-blue-600 dark:text-blue-400" },
    { label: "Frais de circuit",  value: devis.fraisCircuit,   bar: "bg-violet-500", text: "text-violet-600" },
    { label: "Prestation SLTT",   value: devis.fraisPrestation, bar: "bg-orange-400", text: "text-orange-600" },
  ];
  return (
    <div className="p-5 space-y-3">
      {items.map((item) => {
        const pct = devis.total > 0 ? (item.value / devis.total) * 100 : 0;
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className={cn("text-xs font-bold tabular-nums", item.text)}>{formatFCFA(item.value)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={cn("h-full rounded-full", item.bar)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-primary px-4 py-3">
        <span className="text-sm font-bold text-white">Total estimé</span>
        <span className="text-lg font-extrabold tabular-nums text-white">{formatFCFA(devis.total)}</span>
      </div>
    </div>
  );
}
