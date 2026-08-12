"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type KpiTone = "blue" | "emerald" | "amber" | "red" | "indigo" | "violet";

const iconWrap: Record<KpiTone, string> = {
  blue: "bg-accent text-primary dark:bg-accent/30 dark:text-primary",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  amber: "bg-[var(--brand-secondary-light)] text-[var(--brand-secondary)] dark:bg-red-950/50 dark:text-red-400",
  red: "bg-[var(--brand-secondary-light)] text-[var(--brand-secondary)] dark:bg-red-950/50 dark:text-red-400",
  indigo: "bg-accent text-primary dark:bg-accent/30 dark:text-primary",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  variation,
  variationLabel,
  sublabel,
  tooltip,
  compact = false,
  valueNegative = false,
  className,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  variation?: number;
  variationLabel?: string;
  sublabel?: string;
  tooltip?: string;
  /** Affiche la valeur en rouge (ex. bénéfice négatif) */
  valueNegative?: boolean;
  /** Grille dense (factures, fournisseurs) */
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <Card className={cn("flex h-full items-center gap-3 rounded-xl border-border/80 p-4 shadow-sm", className)}>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            iconWrap[tone],
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="truncate text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "flex h-full min-h-[7.5rem] flex-col justify-between gap-0 rounded-xl border-border/80 p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-start gap-1 text-xs font-medium leading-snug text-slate-500 dark:text-slate-400">
            <span className="text-pretty">{label}</span>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="mt-0.5 inline-flex shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={`Aide : ${label}`}
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </p>
          <p
            className={cn(
              "mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl break-words",
              valueNegative ? "text-destructive" : "text-slate-900 dark:text-slate-100",
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10",
            iconWrap[tone],
          )}
        >
          <Icon className="size-4 sm:size-5" />
        </div>
      </div>

      {(variation !== undefined || sublabel) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {variation !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
                variation >= 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
              )}
            >
              {variation >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {variation >= 0 ? "+" : ""}
              {variation}%
            </span>
          )}
          {variationLabel && (
            <span className="text-slate-400 dark:text-slate-500">{variationLabel}</span>
          )}
          {sublabel && (
            <span className="text-pretty text-slate-400 dark:text-slate-500">{sublabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}
