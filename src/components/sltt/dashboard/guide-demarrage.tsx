"use client";

import * as React from "react";
import { ArrowRight, Check, Compass, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  GUIDE_DISMISS_KEY,
  GUIDE_RESET_EVENT,
  getGuideProgress,
  type GuideStepView,
} from "@/lib/guide-progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GuideDemarrage({
  role,
  go,
}: {
  role: string;
  go: (view: GuideStepView) => void;
}) {
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const ecritures = useStore((s) => s.ecritures);
  const stock = useStore((s) => s.stock);
  const bons = useStore((s) => s.bons);

  const guideData = React.useMemo(
    () => ({
      clientsCount: clients.length,
      dossiersCount: dossiers.length,
      ecrituresCount: ecritures.length,
      dossiersSoldesCount: dossiers.filter((d) => d.statut === "Soldé").length,
      stockCount: stock.length,
      bonsCount: bons.length,
    }),
    [clients.length, dossiers, ecritures.length, stock.length, bons.length],
  );

  const progress = React.useMemo(
    () => getGuideProgress(role as import("@/lib/domain-types").UserRole, guideData),
    [role, guideData],
  );

  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(GUIDE_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [forceShow, setForceShow] = React.useState(false);

  React.useEffect(() => {
    const handler = () => {
      setDismissed(false);
      setForceShow(true);
    };
    window.addEventListener(GUIDE_RESET_EVENT, handler);
    return () => window.removeEventListener(GUIDE_RESET_EVENT, handler);
  }, []);

  React.useEffect(() => {
    if (progress.allComplete && !dismissed) {
      try {
        localStorage.setItem(GUIDE_DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [progress.allComplete, dismissed]);

  if (progress.total === 0) return null;
  if ((dismissed && !forceShow) || progress.allComplete) return null;

  function isStepDone(stepId: string): boolean {
    switch (stepId) {
      case "clients":
        return guideData.clientsCount > 0;
      case "dossiers":
        return guideData.dossiersCount > 0;
      case "paiements":
        return guideData.ecrituresCount > 0;
      case "bilans":
        return guideData.dossiersSoldesCount > 0;
      case "stock":
        return guideData.stockCount > 0;
      case "bons":
        return guideData.bonsCount > 0;
      default:
        return false;
    }
  }

  const firstPending = progress.steps.find((s) => !isStepDone(s.id));

  function dismiss() {
    setDismissed(true);
    setForceShow(false);
    try {
      localStorage.setItem(GUIDE_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="gap-0 border-blue-200/70 bg-blue-50/40 p-0 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20">
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Par où commencer ?
          </h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {progress.completed}/{progress.total}
          </span>
        </div>
        <button
          onClick={dismiss}
          aria-label="Masquer le guide de démarrage"
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-100/60 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-blue-900/40 dark:hover:text-slate-200"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mx-4 mb-2 mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/50">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] dark:bg-blue-500"
          style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {progress.steps.map((s, i) => {
          const done = isStepDone(s.id);
          const isNext = firstPending?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => go(s.view)}
              className={cn(
                "group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                done
                  ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                  : isNext
                    ? "border-blue-300 bg-white dark:border-blue-700 dark:bg-slate-900"
                    : "border-border/60 bg-white dark:bg-slate-900",
                !done && "hover:border-blue-300 dark:hover:border-blue-700",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {s.label}
                </span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {done ? "Terminé" : s.sub}
                </span>
              </span>
              {!done && (
                <ArrowRight className="size-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500 dark:text-slate-600" />
              )}
            </button>
          );
        })}
      </div>
      {firstPending && progress.completed < progress.total && (
        <div className="border-t border-blue-200/50 px-5 py-3 dark:border-blue-900/40">
          <Button size="sm" variant="outline" className="h-8" onClick={() => go(firstPending.view)}>
            Continuer : {firstPending.label}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}
