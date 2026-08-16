"use client";

import { cn } from "@/lib/utils";

export function AnnexePicker({
  annexes,
  value,
  onChange,
}: {
  annexes: { id: string; nom: string }[];
  value: string[];
  onChange: (annexeIds: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {annexes.map((a) => {
        const selected = value.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(a.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition-all",
              selected
                ? "border-primary bg-primary/5 text-primary ring-2 ring-primary"
                : "border-border bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:border-slate-300",
            )}
          >
            {a.nom}
          </button>
        );
      })}
    </div>
  );
}
