"use client";

import type { Facture } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { LignesTable } from "./lignes-table";
import { FinancialSummary } from "./financial-summary";

export function LignesCard({ facture }: { facture: Facture }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Lignes de facturation
        </h2>
        <span className="text-[10px] tabular-nums text-slate-400">
          {facture.lignes.length} ligne{facture.lignes.length !== 1 ? "s" : ""}
        </span>
      </div>
      <LignesTable lignes={facture.lignes} />
      <div className="border-t border-border/60 bg-slate-50/30 dark:bg-slate-800/30">
        <FinancialSummary
          montantHT={facture.montantHT}
          tauxTVA={facture.tauxTVA}
          montantTVA={facture.montantTVA}
          montantTTC={facture.montantTTC}
          montantPaye={facture.montantPaye}
        />
      </div>
    </Card>
  );
}
