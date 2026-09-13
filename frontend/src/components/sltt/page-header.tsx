"use client";

import { cn } from "@/shared/utils/cn";

export function PageHeader({
  title,
  description,
  children,
  className,
  showTitle = true,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  /** Afficher le titre h1 — par défaut activé pour cohérence visuelle */
  showTitle?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1",
        className,
      )}
    >
      <div className="min-w-0">
        {showTitle && (
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {title}
          </h1>
        )}
        {description && (
          <p className={cn("text-xs sm:text-sm text-muted-foreground font-medium", showTitle && "mt-1")}>
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{children}</div>
      )}
    </div>
  );
}
