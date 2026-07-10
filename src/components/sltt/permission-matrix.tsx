"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  PERMISSION_MODULES,
  ROLE_DEFAULT_PERMISSIONS,
  permissionsToSelection,
  selectionToPermissions,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/domain-types";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionMatrixProps {
  selection: Record<string, boolean>;
  onChange: (selection: Record<string, boolean>) => void;
  disabled?: boolean;
}

export function PermissionMatrix({ selection, onChange, disabled }: PermissionMatrixProps) {
  function toggle(key: string, checked: boolean) {
    onChange({ ...selection, [key]: checked });
  }

  function toggleModule(moduleId: string, checked: boolean) {
    const permModule = PERMISSION_MODULES.find((m) => m.id === moduleId);
    if (!permModule) return;
    const next = { ...selection };
    for (const perm of permModule.permissions) {
      next[perm.key] = checked;
    }
    onChange(next);
  }

  return (
    <div className="space-y-2 max-h-[360px] overflow-y-auto rounded-lg border border-border bg-slate-50/50 dark:bg-slate-800/50 p-3">
      {PERMISSION_MODULES.map((permModule) => {
        const moduleKeys = permModule.permissions.map((p) => p.key);
        const allChecked = moduleKeys.every((k) => selection[k]);
        const someChecked = moduleKeys.some((k) => selection[k]);
        const activeCount = moduleKeys.filter((k) => selection[k]).length;

        return (
          <details
            key={permModule.id}
            className="group rounded-md border border-border/60 bg-white dark:bg-slate-900"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
              <div className="flex min-w-0 items-center gap-2">
                <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {permModule.label}
                </span>
                <span className="text-xs text-slate-500">
                  {activeCount}/{moduleKeys.length}
                </span>
              </div>
              <label
                className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleModule(permModule.id, Boolean(v))}
                  disabled={disabled}
                />
                Tout
              </label>
            </summary>
            <div className={cn("border-t border-border/50 px-3 pb-3 pt-2")}>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {permModule.permissions.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Checkbox
                      checked={selection[perm.key] ?? false}
                      onCheckedChange={(v) => toggle(perm.key, Boolean(v))}
                      disabled={disabled}
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function defaultSelectionForRole(role: UserRole): Record<string, boolean> {
  return permissionsToSelection(ROLE_DEFAULT_PERMISSIONS[role]);
}

export function permissionsFromSelection(selection: Record<string, boolean>): string[] {
  return selectionToPermissions(selection);
}
