"use client";

import React from "react";
import { cn } from "@/shared/utils/cn";
import { ChevronRight } from "lucide-react";

interface SettingsNavItemProps {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: React.ReactNode;
  onClick: () => void;
}

export function SettingsNavItem({
  label,
  description,
  icon: Icon,
  isActive,
  badge,
  onClick,
}: SettingsNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-150 cursor-pointer",
        isActive
          ? "bg-blue-50/80 text-blue-900 shadow-xs ring-1 ring-blue-500/20 dark:bg-blue-950/40 dark:text-blue-100 dark:ring-blue-400/30"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
      )}
    >
      {/* Barre indicatrice active à gauche */}
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400" />
      )}

      {/* Icône avec conteneur stylisé */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          isActive
            ? "bg-blue-600 text-white shadow-xs dark:bg-blue-500"
            : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200"
        )}
      >
        <Icon className="size-4" />
      </div>

      {/* Libellé et description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-bold tracking-tight truncate",
              isActive
                ? "text-blue-950 dark:text-white"
                : "text-slate-800 dark:text-slate-200"
            )}
          >
            {label}
          </span>
          {badge}
        </div>
        <p
          className={cn(
            "text-[11px] truncate mt-0.5",
            isActive
              ? "text-blue-700/80 dark:text-blue-300/80 font-medium"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          {description}
        </p>
      </div>

      {/* Flèche subtile */}
      <ChevronRight
        className={cn(
          "size-4 shrink-0 transition-transform duration-150",
          isActive
            ? "text-blue-600 dark:text-blue-400 translate-x-0.5"
            : "text-slate-300 opacity-0 group-hover:opacity-100 dark:text-slate-600"
        )}
      />
    </button>
  );
}
