"use client";

import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LiveAlert } from "@/lib/dashboard-metrics";
import { Card } from "@/components/ui/card";

export function AlertesCard({
  alertes,
  onAlertClick,
}: {
  alertes: LiveAlert[];
  onAlertClick: (alert: LiveAlert) => void;
}) {
  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80 rounded-xl">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3.5">
        <AlertTriangle className="size-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Alertes</h2>
        {alertes.length > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-none text-white">
            {alertes.length}
          </span>
        )}
      </div>

      <div className="max-h-64 divide-y divide-border/60 overflow-y-auto">
        {alertes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="size-7 text-emerald-300" />
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Aucune alerte</p>
          </div>
        ) : (
          alertes.map((alert) => {
            const isDanger = alert.niveau === "danger";
            const AlertIcon = isDanger ? AlertTriangle : AlertCircle;
            return (
              <div
                key={alert.id}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onClick={() => onAlertClick(alert)}
                onKeyDown={(e) => e.key === "Enter" && onAlertClick(alert)}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    isDanger ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                  }`}
                >
                  <AlertIcon className="size-4" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="truncate text-xs font-semibold leading-snug text-slate-800 dark:text-slate-200">
                    {alert.message}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-400 dark:text-slate-500">
                    {alert.detail}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
