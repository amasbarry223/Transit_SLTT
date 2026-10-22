"use client";

import { BookOpen, PenLine } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { RecuMode } from "./use-recu-generator";

const MODES: { value: RecuMode; label: string; icon: typeof PenLine }[] = [
  { value: "saisie", label: "Saisie directe", icon: PenLine },
  { value: "vierge", label: "Carnet vierge", icon: BookOpen },
];

/** Sélecteur segmenté Saisie directe / Carnet vierge — partagé desktop et mobile. */
export function RecuModeToggle({
  mode,
  onModeChange,
  disabled,
  className,
}: {
  mode: RecuMode;
  onModeChange: (mode: RecuMode) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Type de reçu"
      className={cn("grid grid-cols-2 gap-1 rounded-xl border border-border/50 bg-muted/60 p-1 text-xs", className)}
    >
      {MODES.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onModeChange(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              active ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
