"use client";

import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Pastille de statut suivant — pattern identique dupliqué entre dossiers-list.tsx
 * (TRANSITION_META) et devis.tsx (NEXT_STATUT) avant extraction.
 */
export function StatusQuickAction({
  label,
  colorClass,
  bgClass,
  onClick,
}: {
  label: string;
  colorClass: string;
  bgClass: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80",
        bgClass,
        colorClass,
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
