"use client";

import type { ComponentType, ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusStepConfig = {
  icon: ComponentType<{ className?: string }>;
  desc: string;
};

export type StatusVerticalStepperProps<S extends string> = {
  statut: S;
  flow: readonly S[];
  config: Record<S, StatusStepConfig>;
  allowedNext: readonly S[];
  onSelect: (s: S) => void;
  canWrite: boolean;
  /** Si true (ou fourni), remplace le pipeline par une pastille terminale. */
  isTerminal?: boolean;
  renderTerminal?: ReactNode;
  /** Statuts non cliquables même s'ils sont dans allowedNext (ex. Partielle facture). */
  blockedManual?: readonly S[];
};

export function StatusVerticalStepper<S extends string>({
  statut,
  flow,
  config,
  allowedNext,
  onSelect,
  canWrite,
  isTerminal,
  renderTerminal,
  blockedManual = [],
}: StatusVerticalStepperProps<S>) {
  if (isTerminal && renderTerminal) {
    return <>{renderTerminal}</>;
  }

  const currentIdx = flow.indexOf(statut);
  const blocked = new Set(blockedManual);

  return (
    <div>
      {flow.map((s, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        const clickable =
          canWrite && !done && !current && !blocked.has(s) && allowedNext.includes(s);
        const cfg = config[s];
        const Icon = cfg.icon;
        const isLast = idx === flow.length - 1;

        return (
          <div key={s} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => clickable && onSelect(s)}
                disabled={!clickable}
                title={clickable ? `Passer à ${s}` : s}
                aria-label={clickable ? `Passer à ${s}` : s}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  done
                    ? "cursor-default border-emerald-500 bg-emerald-500 text-white"
                    : current
                      ? "cursor-default border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950"
                      : clickable
                        ? "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted"
                        : "cursor-not-allowed border-border/60 bg-muted/50 text-muted-foreground/80",
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}
              </button>
              {!isLast && (
                <div
                  className={cn(
                    "min-h-[28px] w-0.5 flex-1",
                    done ? "bg-emerald-200" : "bg-muted",
                  )}
                />
              )}
            </div>
            <div className={cn("pt-1.5", !isLast && "pb-5")}>
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  current
                    ? "text-blue-700 dark:text-blue-300"
                    : done
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground",
                )}
              >
                {s}
                {current && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    Actuel
                  </span>
                )}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs leading-relaxed",
                  current
                    ? "text-blue-500"
                    : done
                      ? "text-emerald-500"
                      : "text-muted-foreground",
                )}
              >
                {cfg.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
