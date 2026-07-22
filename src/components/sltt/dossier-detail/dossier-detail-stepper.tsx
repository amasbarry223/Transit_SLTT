"use client";

import { Check } from "lucide-react";
import type { DossierStatut } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUTS_ORDERED: DossierStatut[] = ["En cours", "Dédouané", "Livré", "Soldé"];

export function DossierDetailStepper({ statut }: { statut: DossierStatut }) {
  const currentIdx = STATUTS_ORDERED.indexOf(statut);
  return (
    <div
      role="list"
      aria-label="Progression du dossier"
      className="-mx-1 flex items-start overflow-x-auto pb-1 scrollbar-none"
    >
      {STATUTS_ORDERED.map((s, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        const isLast = i === STATUTS_ORDERED.length - 1;
        return (
          <div
            key={s}
            role="listitem"
            aria-current={active ? "step" : undefined}
            className={cn("flex min-w-[4.5rem] flex-col items-center", !isLast && "flex-1")}
          >
            <div className="flex w-full items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 min-w-[1rem] flex-1 transition-colors",
                    done ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-center text-[11px] leading-tight sm:text-xs",
                !isLast && "w-full px-1",
                active
                  ? "font-semibold text-primary"
                  : done
                    ? "text-slate-600 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500",
              )}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}
