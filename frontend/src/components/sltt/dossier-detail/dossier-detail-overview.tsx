"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { Dossier } from "@/lib/domain-types";
import { formatFCFA } from "@/lib/format";
import {
  TRANSITION_META,
  type TransitionType,
} from "@/components/sltt/dossier-transition-dialog";
import { Card } from "@/shared/components/ui/card";
import { EcartValue, StatutPaiementBadge } from "@/components/sltt/status-badge";
import { financesDossier } from "@/lib/domain/dossier-finances";
import { DossierInfoGrid } from "./dossier-info-grid";
import { DossierLignesTables } from "./dossier-lignes-tables";
import { cn } from "@/shared/utils/cn";

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
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "emerald" && "text-emerald-700 dark:text-emerald-400",
          tone === "amber" && "text-amber-700 dark:text-amber-300",
          tone === "red" && "text-red-600 dark:text-red-400",
          !tone && "text-foreground",
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
  echeanceDepassee,
  echeanceImminente,
  joursRestants,
}: {
  dossier: Dossier;
  ecart: number;
  reste: number;
  nextTransition: TransitionType | null;
  echeanceDepassee: boolean;
  echeanceImminente: boolean;
  joursRestants: number | null;
  /** Code annexe (ML/CI) — n'est plus utilisé depuis la suppression des rubriques douane/circuit. */
  annexeCode?: string | null;
}) {
  const [amountsOpen, setAmountsOpen] = useState(false);
  const finances = financesDossier(dossier);

  return (
    <div className="space-y-6">
      {nextTransition ? (
        (() => {
          const meta = TRANSITION_META[nextTransition];
          const Icon = meta.icon;
          // Purement informatif — l'action de transition vit uniquement dans le
          // Hero (en-tête), pour ne pas proposer le même bouton deux fois sur
          // le même écran (l'Aperçu est l'onglet ouvert par défaut).
          return (
            <Card className="border-border/80 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.bgClass, meta.colorClass)}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Prochaine étape</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{meta.actionDescription}</p>
                </div>
              </div>
            </Card>
          );
        })()
      ) : (
        <Card className="border-border/80 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Dossier clôturé</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ce dossier est soldé. Tous les paiements ont été enregistrés.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-border/80 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Informations du voyage</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
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
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
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
            <p className="mt-0.5 text-xs text-muted-foreground">Contrat, paiements, dépenses et bénéfice net</p>
          </div>
          {amountsOpen ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
        </button>
        {amountsOpen && (
          <div className="border-t border-border px-5 pb-5 pt-2">
            <AmountRow label="Total contrat" value={finances.totalContrat} />
            <AmountRow label="Montant payé" value={finances.montantPaye} tone="emerald" />
            <AmountRow
              label={reste < 0 ? "Trop-perçu" : "Reste à payer"}
              value={Math.abs(reste)}
              tone={reste > 0 ? "amber" : "emerald"}
            />
            <AmountRow label="Dépenses" value={finances.totalDepenses} />
            <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-border pt-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                Bénéfice net
                <StatutPaiementBadge statut={finances.statutPaiement} size="sm" />
              </span>
              <EcartValue value={ecart} />
            </div>
            <DossierLignesTables dossier={dossier} className="mt-4" />
          </div>
        )}
      </Card>
    </div>
  );
}
