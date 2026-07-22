"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { Dossier } from "@/lib/domain-types";
import { formatFCFA } from "@/lib/format";
import {
  TRANSITION_META,
  type TransitionType,
} from "@/components/sltt/dossier-transition-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EcartValue } from "@/components/sltt/status-badge";
import { DossierInfoGrid } from "./dossier-info-grid";
import { cn } from "@/lib/utils";

function AmountRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "red";
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "emerald" && "text-emerald-700 dark:text-emerald-400",
          tone === "amber" && "text-amber-700",
          tone === "red" && "text-red-600 dark:text-red-400",
          !tone && "text-slate-900 dark:text-slate-100",
        )}
      >
        {formatFCFA(value)}
      </span>
    </div>
  );
}

export function DossierDetailOverview({
  dossier,
  ecart,
  reste,
  nextTransition,
  canTransition,
  echeanceDepassee,
  echeanceImminente,
  joursRestants,
  onTransition,
}: {
  dossier: Dossier;
  ecart: number;
  reste: number;
  nextTransition: TransitionType | null;
  canTransition: boolean;
  echeanceDepassee: boolean;
  echeanceImminente: boolean;
  joursRestants: number | null;
  onTransition: () => void;
}) {
  const [amountsOpen, setAmountsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {nextTransition ? (
        (() => {
          const meta = TRANSITION_META[nextTransition];
          const Icon = meta.icon;
          return (
            <Card className={cn("border-l-4 p-5 shadow-sm", meta.borderClass)}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.bgClass, meta.colorClass)}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Prochaine étape</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{meta.actionDescription}</p>
                  </div>
                </div>
                <Button
                  className="shrink-0 self-start"
                  onClick={onTransition}
                  disabled={!canTransition}
                  title={!canTransition ? "Permission insuffisante pour changer le statut." : undefined}
                >
                  {meta.confirmLabel}
                </Button>
              </div>
            </Card>
          );
        })()
      ) : (
        <Card className="border-l-4 border-l-emerald-500 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Dossier clôturé</h2>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                Ce dossier est soldé. Tous les paiements ont été enregistrés.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-border/80 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Informations du voyage</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Transport, marchandise et dates clés de ce dossier.
        </p>
        <div className="mt-4">
          <DossierInfoGrid
            dossier={dossier}
            echeanceDepassee={echeanceDepassee}
            echeanceImminente={echeanceImminente}
            joursRestants={joursRestants}
          />
        </div>
      </Card>

      {dossier.notes && (
        <Card className="border-border/80 p-5 shadow-sm">
          <h2 className="text-base font-semibold">Notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {dossier.notes}
          </p>
        </Card>
      )}

      <Card className="border-border/80 shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between p-5 text-left"
          onClick={() => setAmountsOpen((v) => !v)}
        >
          <div>
            <h2 className="text-base font-semibold">Détail des montants</h2>
            <p className="mt-0.5 text-xs text-slate-500">Douane, circuit, prestation et marge</p>
          </div>
          {amountsOpen ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
        </button>
        {amountsOpen && (
          <div className="border-t border-border px-5 pb-5 pt-2">
            <AmountRow label="Droit de douane" value={dossier.droitDouane} />
            <AmountRow label="Frais de circuit" value={dossier.fraisCircuit} />
            <AmountRow label="Frais de prestation" value={dossier.fraisPrestation} />
            <Separator className="my-2" />
            <AmountRow label="Montant investi" value={dossier.montantInvesti} />
            <AmountRow label="Montant payé" value={dossier.montantPaye} tone="emerald" />
            <AmountRow label="Reste à payer" value={reste} tone={reste > 0 ? "amber" : "emerald"} />
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm text-slate-500">Marge calculée</span>
              <EcartValue value={ecart} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Prestation − (Douane + Circuit)</p>
          </div>
        )}
      </Card>
    </div>
  );
}
