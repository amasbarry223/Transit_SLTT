"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  startIdx: number;
  endIdx: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function TablePagination({
  page,
  totalPages,
  startIdx,
  endIdx,
  totalItems,
  onPageChange,
  itemLabel,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
        {startIdx}–{endIdx} sur {totalItems}
        {itemLabel ? ` ${itemLabel}` : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Page précédente"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Page suivante"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
