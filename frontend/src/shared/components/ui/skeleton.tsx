"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-md bg-muted/60", className)}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lines > 1 ? "w-3/5" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("rounded-full shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonCard({
  className,
  hasHeader = true,
}: {
  className?: string;
  hasHeader?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-56 max-w-full" />
          </div>
          <Skeleton className="size-8 rounded-lg" />
        </div>
      )}
      <div className="space-y-3">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs", className)}>
      <div className="border-b border-border/60 bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {/* Header row */}
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-20" />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid items-center gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  "h-4",
                  c === 0 ? "w-28 font-medium" : c === cols - 1 ? "w-16" : "w-20",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
