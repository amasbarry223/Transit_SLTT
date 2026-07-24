"use client";

import { ArrowRight, ClipboardList } from "lucide-react";
import type { Dossier } from "@/lib/domain-types";
import { formatFCFACompact } from "@/lib/format";
import { DossierStatutBadge, DOSSIER_STATUT_DOT } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DerniersDossiersCard({
  dossiers,
  onGoToDossiers,
  onOpenDossier,
  className,
}: {
  dossiers: Dossier[];
  onGoToDossiers: () => void;
  onOpenDossier: (id: string) => void;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden p-0 shadow-sm border-border/80 rounded-xl", className)}>

      {/* Header — même rythme que les cards de graphiques ci-dessus (px-5, titre text-sm) */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Derniers dossiers</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            {dossiers.length}
          </span>
        </div>
        <button
          onClick={onGoToDossiers}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Voir tout <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* Labels colonnes */}
      <div className="grid grid-cols-[1fr_1.5fr_auto_auto] gap-x-3 border-b border-border/60 bg-slate-50/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <span>Référence</span>
        <span>Client</span>
        <span>Statut</span>
        <span className="text-right">Montant</span>
      </div>

      {/* Lignes */}
      <div className="divide-y divide-border/60">
        {dossiers.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Aucun dossier enregistré.</div>
        ) : (
          dossiers.map((d) => {
            const dotColor = DOSSIER_STATUT_DOT[d.statut];
            return (
              <div
                key={d.id}
                role="button"
                tabIndex={0}
                className="grid cursor-pointer grid-cols-[1fr_1.5fr_auto_auto] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onClick={() => onOpenDossier(d.id)}
                onKeyDown={(e) => e.key === "Enter" && onOpenDossier(d.id)}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${dotColor}`} />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200">
                      {d.reference.replace(/^.+-TR-/, "")}
                    </p>
                    <p className="text-[11px] leading-tight text-slate-400 dark:text-slate-500">{d.bl}</p>
                  </div>
                </div>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">{d.clientNom}</p>
                <DossierStatutBadge statut={d.statut} />
                <p className="text-right font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatFCFACompact(d.montantInvesti)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
