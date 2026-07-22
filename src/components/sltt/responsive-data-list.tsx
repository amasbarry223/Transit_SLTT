"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ResponsiveColumn<T> = {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  /** Libellé affiché sur mobile (défaut = header) */
  mobileLabel?: string;
  /** Masquer sur mobile si la valeur est secondaire */
  hideOnMobile?: boolean;
  className?: string;
  headerClassName?: string;
};

type ResponsiveDataListProps<T> = {
  items: T[];
  columns: ResponsiveColumn<T>[];
  getRowKey: (item: T) => string;
  renderActions?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  tableHeader?: ReactNode;
};

export function ResponsiveDataList<T>({
  items,
  columns,
  getRowKey,
  renderActions,
  onRowClick,
  emptyState,
  tableHeader,
}: ResponsiveDataListProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const visibleMobileCols = columns.filter((c) => !c.hideOnMobile);

  return (
    <>
      {/* Mobile — cartes empilées */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <Card
            key={getRowKey(item)}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            className={cn(
              "border-border/80 p-4 shadow-sm",
              onRowClick && "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
            )}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }
                : undefined
            }
          >
            <dl className="space-y-2">
              {visibleMobileCols.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {col.mobileLabel ?? col.header}
                  </dt>
                  <dd className={cn("min-w-0 text-right font-medium text-slate-900 dark:text-slate-100", col.className)}>
                    {col.cell(item)}
                  </dd>
                </div>
              ))}
            </dl>
            {renderActions && (
              <div
                className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {renderActions(item)}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Desktop — table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              {tableHeader}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
              {renderActions && (
                <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={getRowKey(item)}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60",
                  onRowClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                )}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(item);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3.5", col.className)}
                  >
                    {col.cell(item)}
                  </td>
                ))}
                {renderActions && (
                  <td
                    className="px-4 py-3.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderActions(item)}
                  </td>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
