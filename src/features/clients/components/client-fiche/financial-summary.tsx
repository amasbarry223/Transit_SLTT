"use client";

import { BellRing, CheckCircle2, TrendingUp, Wallet } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type FinancialSummaryProps = {
  totalDu: number;
  totalPaye: number;
  totalInvesti: number;
  /** Nb de lignes du classeur encore débitrices. */
  pendingCount: number;
  onSeeClasseur?: () => void;
  onRelance?: () => void;
};

/**
 * Bandeau financier de la fiche client : un chiffre dominant (reste à payer)
 * + deux chiffres secondaires. Remplace les 4 KPI « (historique) » équivalents
 * qui noyaient l'information la plus importante.
 */
export function FinancialSummary({
  totalDu,
  totalPaye,
  totalInvesti,
  pendingCount,
  onSeeClasseur,
  onRelance,
}: FinancialSummaryProps) {
  const owes = totalDu > 0;

  return (
    <Card className="overflow-hidden border-border/80 p-0 shadow-sm">
      <div className="flex flex-col divide-y divide-border/70 lg:flex-row lg:divide-x lg:divide-y-0">
        {/* Chiffre dominant : reste à payer */}
        <div
          className={cn(
            "flex flex-1 flex-col gap-2 p-5",
            owes ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-emerald-50/50 dark:bg-emerald-950/15",
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reste à payer
          </span>
          <span
            className={cn(
              "text-3xl font-bold tabular-nums tracking-tight",
              owes ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
            )}
          >
            {formatFCFA(totalDu)}
          </span>

          {owes ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {onSeeClasseur && (
                <button
                  type="button"
                  onClick={onSeeClasseur}
                  className="text-sm font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
                >
                  {pendingCount} solde{pendingCount !== 1 ? "s" : ""} ouvert{pendingCount !== 1 ? "s" : ""}
                </button>
              )}
              {onRelance && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-amber-300 bg-white/70 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:text-amber-200"
                  onClick={onRelance}
                >
                  <BellRing className="size-3.5" />
                  Relancer
                </Button>
              )}
            </div>
          ) : (
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
              Compte à jour
            </span>
          )}
        </div>

        {/* Chiffres secondaires */}
        <div className="grid flex-1 grid-cols-2 divide-x divide-border/70">
          <Stat
            icon={Wallet}
            label="Déjà encaissé"
            value={formatFCFA(totalPaye)}
            valueClass="text-emerald-700 dark:text-emerald-400"
          />
          <Stat
            icon={TrendingUp}
            label="Total investi"
            value={formatFCFA(totalInvesti)}
            valueClass="text-foreground"
          />
        </div>
      </div>

      <p className="border-t border-border/70 px-5 py-2 text-[11px] text-muted-foreground">
        Sur tout l&apos;historique du client — l&apos;onglet Classeur permet de filtrer par période.
      </p>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className={cn("text-xl font-bold tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}
