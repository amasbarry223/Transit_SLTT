"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoCallout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/60 px-4 py-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-blue-500 dark:text-blue-400" aria-hidden />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}
