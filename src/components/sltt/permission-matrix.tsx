"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  PERMISSION_MODULES,
  ROLE_DEFAULT_PERMISSIONS,
  permissionsToSelection,
  selectionToPermissions,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/domain-types";
import { cn } from "@/lib/utils";

const PRESET_ROLES: UserRole[] = [
  "Agent de transit",
  "Comptable",
  "Magasinier",
  "Administrateur",
];

interface PermissionMatrixProps {
  selection: Record<string, boolean>;
  onChange: (selection: Record<string, boolean>) => void;
  disabled?: boolean;
  /** Affiche d'abord les profils métier ; la matrice détaillée est en mode avancé. */
  presetFirst?: boolean;
  currentRole?: UserRole;
}

export function PermissionMatrix({
  selection,
  onChange,
  disabled,
  presetFirst = false,
  currentRole,
}: PermissionMatrixProps) {
  const [advancedOpen, setAdvancedOpen] = useState(!presetFirst);

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

  function applyPreset(role: UserRole) {
    onChange(permissionsToSelection(ROLE_DEFAULT_PERMISSIONS[role]));
  }

  const activeCount = selectionToPermissions(selection).length;

  return (
    <div className="space-y-3">
      {presetFirst && (
        <div className="space-y-3 rounded-lg border border-border bg-white p-3 dark:bg-slate-900">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Profil métier</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Applique un jeu de permissions standard — ajustez en mode avancé si besoin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_ROLES.map((role) => (
              <Button
                key={role}
                type="button"
                size="sm"
                variant={currentRole === role ? "default" : "outline"}
                disabled={disabled}
                onClick={() => applyPreset(role)}
              >
                {role}
              </Button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold tabular-nums text-primary">{activeCount}</span> permission
            {activeCount > 1 ? "s" : ""} active{activeCount > 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between border-t border-border pt-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            Mode avancé — matrice détaillée
            <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
          </button>
        </div>
      )}

      {(!presetFirst || advancedOpen) && (
        <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-border bg-slate-50/50 p-3 dark:bg-slate-800/50">
          {PERMISSION_MODULES.map((permModule) => {
            const moduleKeys = permModule.permissions.map((p) => p.key);
            const allChecked = moduleKeys.every((k) => selection[k]);
            const someChecked = moduleKeys.some((k) => selection[k]);
            const moduleActiveCount = moduleKeys.filter((k) => selection[k]).length;

            return (
              <details
                key={permModule.id}
                className="group rounded-md border border-border/60 bg-white dark:bg-slate-900"
                open={permModule.id === "dashboard"}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {permModule.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {moduleActiveCount}/{moduleKeys.length}
                    </span>
                  </div>
                  <label
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
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
      )}
    </div>
  );
}

export function defaultSelectionForRole(role: UserRole): Record<string, boolean> {
  return permissionsToSelection(ROLE_DEFAULT_PERMISSIONS[role]);
}

export function permissionsFromSelection(selection: Record<string, boolean>): string[] {
  return selectionToPermissions(selection);
}
