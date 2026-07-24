"use client";

import { AlertTriangle, History, PackageMinus, PackagePlus } from "lucide-react";
import type { StockItem } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { StockStatutBadge } from "@/components/sltt/status-badge";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function StockRow({
  item,
  onEntry,
  onExit,
  onHistory,
  onOpenClient,
  canWrite = true,
}: {
  item: StockItem;
  onEntry: (id: string) => void;
  onExit: (id: string) => void;
  onHistory: (stockId: string, marchandise: string) => void;
  onOpenClient?: (clientId: string) => void;
  canWrite?: boolean;
}) {
  const faible = item.quantite < item.seuil;
  const statut = faible ? "Stock faible" : "Disponible";

  return (
    <TableRow
      className={cn(
        "border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60",
        faible && "bg-red-50/40 dark:bg-red-950/20",
      )}
    >
      <TableCell className="px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
            {faible && (
              <AlertTriangle className="size-3.5 shrink-0 text-red-500" />
            )}
            {item.marchandise}
          </span>
          {item.clientId && item.clientNom && onOpenClient && (
            <button
              type="button"
              className="w-fit text-left text-xs text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onOpenClient(item.clientId!);
              }}
            >
              {item.clientNom}
            </button>
          )}
        </span>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 md:hidden">
          {item.depositaire}
        </p>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 sm:table-cell">
        <SocieteBadge societeNom={item.societeNom} size="sm" />
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right tabular-nums">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.quantite}</span>
        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">{item.unite}</span>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 text-slate-600 dark:text-slate-300 md:table-cell">
        {item.depositaire}
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 text-slate-600 dark:text-slate-300 lg:table-cell">
        {item.commercial}
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 sm:table-cell">
        {formatFCFA(item.sommePayee)}
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-amber-600 dark:text-amber-400 sm:table-cell">
        {formatFCFA(item.resteAPayer)}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <StockStatutBadge statut={statut} />
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-950/40 hover:text-emerald-700"
              aria-label="Entrée de marchandise"
              title="Entrée"
              onClick={() => onEntry(item.id)}
            >
              <PackagePlus className="size-4" />
            </Button>
          )}
          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:bg-amber-950/40 hover:text-amber-700"
              aria-label="Sortie de marchandise"
              title="Sortie"
              onClick={() => onExit(item.id)}
            >
              <PackageMinus className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label="Historique"
            title="Historique"
            onClick={() => onHistory(item.id, item.marchandise)}
          >
            <History className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function StockCard({
  item,
  onEntry,
  onExit,
  onHistory,
  onOpenClient,
  canWrite = true,
}: {
  item: StockItem;
  onEntry: (id: string) => void;
  onExit: (id: string) => void;
  onHistory: (stockId: string, marchandise: string) => void;
  onOpenClient?: (clientId: string) => void;
  canWrite?: boolean;
}) {
  const faible = item.quantite < item.seuil;
  const statut = faible ? "Stock faible" : "Disponible";

  return (
    <Card
      className={cn(
        "border-border/80 p-4 shadow-sm",
        faible && "bg-red-50/40 dark:bg-red-950/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
            {faible && <AlertTriangle className="size-3.5 shrink-0 text-red-500" />}
            <span className="truncate">{item.marchandise}</span>
          </p>
          {item.clientId && item.clientNom && onOpenClient ? (
            <button
              type="button"
              className="text-left text-xs text-primary hover:underline"
              onClick={() => onOpenClient(item.clientId!)}
            >
              {item.clientNom}
            </button>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.depositaire}</p>
          )}
        </div>
        <StockStatutBadge statut={statut} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Société</dt>
          <dd><SocieteBadge societeNom={item.societeNom} size="sm" /></dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Quantité</dt>
          <dd className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {item.quantite} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{item.unite}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Commercial</dt>
          <dd className="text-slate-700 dark:text-slate-300">{item.commercial}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Payé</dt>
          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(item.sommePayee)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Reste dû</dt>
          <dd className="tabular-nums text-amber-600 dark:text-amber-400">{formatFCFA(item.resteAPayer)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
        {canWrite && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-950/40 hover:text-emerald-700"
            aria-label="Entrée de marchandise"
            title="Entrée"
            onClick={() => onEntry(item.id)}
          >
            <PackagePlus className="size-4" />
          </Button>
        )}
        {canWrite && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:bg-amber-950/40 hover:text-amber-700"
            aria-label="Sortie de marchandise"
            title="Sortie"
            onClick={() => onExit(item.id)}
          >
            <PackageMinus className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
          aria-label="Historique"
          title="Historique"
          onClick={() => onHistory(item.id, item.marchandise)}
        >
          <History className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
