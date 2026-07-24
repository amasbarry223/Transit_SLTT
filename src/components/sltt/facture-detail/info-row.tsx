"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export function InfoRow({
  icon: Icon,
  label,
  value,
  warn,
  mono,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  warn?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-3.5 last:border-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm font-semibold",
            warn ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100",
            mono && "font-mono text-xs",
          )}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
