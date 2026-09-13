"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, ArrowRight, Clock, FileWarning } from "lucide-react";
import type { OperationalAlert } from "@/mock/dashboard";
import { cn } from "@/shared/utils/cn";

interface OperationalAlertsProps {
  alerts: OperationalAlert[];
  onAlertClick: (alert: OperationalAlert) => void;
}

export function OperationalAlerts({ alerts, onAlertClick }: OperationalAlertsProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Alertes à traiter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Points d&apos;attention opérationnels et financiers immédiats
            </p>
          </div>
        </div>

        <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300">
          {alerts.length} actives
        </span>
      </div>

      <div className="space-y-2.5">
        {alerts.map((alert) => {
          const isCritical = alert.severity === "critical";
          const isWarning = alert.severity === "warning";

          return (
            <div
              key={alert.id}
              onClick={() => onAlertClick(alert)}
              className={cn(
                "group flex items-center justify-between rounded-xl p-3 border transition-all cursor-pointer",
                isCritical
                  ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60"
                  : isWarning
                  ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60"
                  : "border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60"
              )}
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <span
                  className={cn(
                    "mt-0.5 flex size-2.5 rounded-full shrink-0",
                    isCritical
                      ? "bg-rose-500 animate-ping"
                      : isWarning
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  )}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-sm",
                        isCritical
                          ? "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100"
                          : isWarning
                          ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
                          : "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                      )}
                    >
                      {alert.badgeText}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {alert.description}
                  </p>
                </div>
              </div>

              <ArrowRight className="size-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
