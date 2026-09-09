"use client";

import { Building2, User } from "lucide-react";
import type { ClientType } from "@/lib/domain-types";
import { cn } from "@/shared/utils/cn";

export function ClientTypeBadge({
  type,
  size = "sm",
}: {
  type: ClientType;
  size?: "sm" | "md";
}) {
  const isEntreprise = type === "Entreprise";
  const Icon = isEntreprise ? Building2 : User;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold transition-colors select-none",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        isEntreprise
          ? "border border-blue-200/80 bg-blue-50 text-[#1344C8] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
          : "border border-slate-200/80 bg-slate-100/80 text-slate-700 dark:border-slate-800 dark:bg-muted dark:text-slate-300",
      )}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5")} />
      <span>{type}</span>
    </span>
  );
}
