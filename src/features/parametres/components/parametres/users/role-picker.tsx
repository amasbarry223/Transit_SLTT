"use client";

import type { UserRole } from "@/lib/store";
import { cn } from "@/lib/utils";
import { allRoles, roleMeta } from "./shared";

export function RolePicker({
  value,
  onChange,
  roles = allRoles,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
  /** Rôles proposés — un délégué non-admin ne doit jamais pouvoir choisir "Administrateur". */
  roles?: UserRole[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.map((r) => {
        const meta = roleMeta[r];
        const Icon = meta.icon;
        const selected = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
              "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              meta.gradient,
              selected
                ? "ring-2 ring-primary border-primary/40 bg-white dark:bg-slate-900"
                : "bg-white/60 dark:bg-slate-900/40",
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                selected ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r}</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                {meta.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
