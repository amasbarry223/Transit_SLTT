"use client";

import { cn } from "@/lib/utils";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

export type EmptyStateAction = {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
};

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  variant = "default",
  className,
}: {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  /** Remplace la pastille Lucide (ex. illustration dossier). */
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  /** @deprecated Préférer primaryAction */
  action?: React.ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: "default" | "error";
  className?: string;
}) {
  const isError = variant === "error";
  const DisplayIcon = isError ? AlertTriangle : Icon;

  const actionButtons =
    primaryAction || secondaryAction ? (
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {primaryAction && (
          <Button size="sm" onClick={primaryAction.onClick}>
            {primaryAction.icon && <primaryAction.icon className="size-4" />}
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.icon && <secondaryAction.icon className="size-4" />}
            {secondaryAction.label}
          </Button>
        )}
      </div>
    ) : (
      action && <div className="mt-4">{action}</div>
    );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center",
        isError
          ? "border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
          : "border-border/80 bg-muted/30",
        className,
      )}
    >
      {illustration ??
        (DisplayIcon && (
          <div
            className={cn(
              "mb-3 flex size-11 items-center justify-center rounded-xl",
              isError
                ? "bg-red-100 text-red-500 dark:bg-red-950/60 dark:text-red-400"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
            )}
          >
            <DisplayIcon className="size-5" />
          </div>
        ))}
      <p
        className={cn(
          "text-sm font-medium",
          isError
            ? "text-red-800 dark:text-red-200"
            : "text-slate-700 dark:text-slate-200",
        )}
      >
        {title}
      </p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {actionButtons}
    </div>
  );
}

/** Empty state d'erreur de chargement avec bouton Réessayer. */
export function LoadErrorState({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  const cfg = UI.empty.loadError;
  return (
    <EmptyState
      variant="error"
      title={cfg.title}
      description={cfg.description}
      primaryAction={
        onRetry
          ? { label: cfg.action, onClick: onRetry }
          : undefined
      }
      className={className}
    />
  );
}
