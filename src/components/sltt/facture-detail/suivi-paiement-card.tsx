"use client";

import { CreditCard } from "lucide-react";
import type { Facture } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentRing } from "./payment-ring";

export function SuiviPaiementCard({
  facture,
  pctPaye,
  reste,
  isEchue,
  canRecordPaiement,
  onShowPaiement,
}: {
  facture: Facture;
  pctPaye: number;
  reste: number;
  isEchue: boolean;
  canRecordPaiement: boolean;
  onShowPaiement: () => void;
}) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Suivi paiement</h2>
      </div>
      <div className="space-y-4 p-5">
        <PaymentRing pct={pctPaye} reste={reste} isEchue={isEchue} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Encaissé</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatFCFA(facture.montantPaye)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total TTC</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">
              {formatFCFA(facture.montantTTC)}
            </p>
          </div>
        </div>
        {canRecordPaiement && (
          <Button className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800" onClick={onShowPaiement}>
            <CreditCard className="size-4" /> Enregistrer un paiement
          </Button>
        )}
      </div>
    </Card>
  );
}
