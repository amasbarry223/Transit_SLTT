"use client";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
  showTitle = false,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  /** Afficher le titre h1 — par défaut masqué car déjà dans la Topbar */
  showTitle?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {showTitle && (
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
        )}
        {description && (
          <p className={cn("text-sm text-slate-500", showTitle && "mt-1")}>
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
