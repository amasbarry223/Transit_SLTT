"use client";

import { useState, type ReactNode } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterChip = {
  id: string;
  label: string;
  active: boolean;
  onToggle: () => void;
};

type ListFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  advanced?: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  actions?: ReactNode;
};

export function ListFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  chips = [],
  advanced,
  activeCount = 0,
  onClear,
  actions,
}: ListFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasChips = chips.length > 0;
  const hasAdvanced = Boolean(advanced);

  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="space-y-3">
        {hasChips && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onToggle}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  chip.active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              className="h-10 pl-9"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {hasAdvanced && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1.5"
              onClick={() => setAdvancedOpen((v) => !v)}
              aria-expanded={advancedOpen}
            >
              Filtres avancés
              <ChevronDown
                className={cn("size-3.5 transition-transform", advancedOpen && "rotate-180")}
              />
            </Button>
          )}

          {activeCount > 0 && onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 gap-1.5 text-slate-500 dark:text-slate-400"
              onClick={onClear}
            >
              <X className="size-3.5" />
              Réinitialiser
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {activeCount}
              </span>
            </Button>
          )}

          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>

        {hasAdvanced && advancedOpen && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            {advanced}
          </div>
        )}
      </div>
    </Card>
  );
}
