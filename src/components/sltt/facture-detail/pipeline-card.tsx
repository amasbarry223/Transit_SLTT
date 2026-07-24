"use client";

import type { Facture, FactureStatut } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { VerticalStepper } from "./vertical-stepper";

export function PipelineCard({
  facture,
  canWrite,
  onSelect,
}: {
  facture: Facture;
  canWrite: boolean;
  onSelect: (s: FactureStatut) => void;
}) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Pipeline</h2>
        <span className="text-[10px] text-slate-400">Cliquez pour changer</span>
      </div>
      <div className="p-5">
        <VerticalStepper statut={facture.statut} onSelect={onSelect} canWrite={canWrite} />
      </div>
    </Card>
  );
}
