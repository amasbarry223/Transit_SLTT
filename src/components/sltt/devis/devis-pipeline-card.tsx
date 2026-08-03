"use client";

import { Card } from "@/components/ui/card";
import { StatusVerticalStepper } from "@/components/sltt/status-vertical-stepper";
import type { DevisStatut } from "@/lib/store";
import { DEVIS_ALLOWED_TRANSITIONS } from "@/lib/status-flow";
import { cn } from "@/lib/utils";
import { STATUT_CONFIG, STATUT_FLOW } from "@/components/sltt/devis/devis-statut-config";

export function DevisPipelineCard({ statut, canWrite, onSelect }: {
  statut: DevisStatut;
  canWrite: boolean;
  onSelect: (statut: DevisStatut) => void;
}) {
  const isTerminal = statut === "Refusé" || statut === "Expiré";
  const cfg = STATUT_CONFIG[statut];
  const Icon = cfg.icon;
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Pipeline</h2>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Cliquez pour changer</span>
      </div>
      <div className="p-5">
        <StatusVerticalStepper
          statut={statut}
          flow={STATUT_FLOW}
          config={STATUT_CONFIG}
          allowedNext={DEVIS_ALLOWED_TRANSITIONS[statut] ?? []}
          onSelect={onSelect}
          canWrite={canWrite}
          isTerminal={isTerminal}
          renderTerminal={
            <div className={cn(
              "flex items-center gap-2.5 rounded-xl p-3",
              statut === "Refusé"
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
            )}>
              <Icon className="size-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">{statut}</p>
                <p className="text-xs opacity-70">{cfg.desc}</p>
              </div>
            </div>
          }
        />
        {canWrite && isTerminal && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-4">
            <button
              onClick={() => onSelect("Brouillon")}
              className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400"
            >
              ↩ Remettre en brouillon
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
