"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  /** Remplace la pastille Lucide (ex. illustration dossier). */
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-12 text-center",
        className,
      )}
    >
      {illustration ??
        (Icon && (
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <Icon className="size-5" />
          </div>
        ))}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
