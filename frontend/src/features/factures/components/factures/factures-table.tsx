"use client";

import { memo } from "react";
import { Eye, Pencil, Plus, Receipt, Send, Trash2 } from "lucide-react";
import type { Facture } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { FactureStatutBadge } from "@/components/sltt/status-badge";
import { EmptyState } from "@/components/sltt/empty-state";
import { UI } from "@/shared/utils/ui-messages";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

function isFactureEchue(f: Facture): boolean {
  return (
    f.statut !== "Soldée" &&
    f.statut !== "Annulée" &&
    f.dateEcheance < new Date().toISOString().slice(0, 10)
  );
}

interface FactureRowProps {
  facture: Facture;
  canWrite: boolean;
  onView: (facture: Facture) => void;
  onEdit: (facture: Facture) => void;
  onMarkEnvoyee: (facture: Facture) => void;
  onDelete: (facture: Facture) => void;
}

const FactureMobileCard = memo(function FactureMobileCard({
  facture: f,
  canWrite,
  onView,
  onEdit,
  onMarkEnvoyee,
  onDelete,
}: FactureRowProps) {
  const isEchue = isFactureEchue(f);
  const isBrouillon = f.statut === "Brouillon";

  return (
    <Card className="border-border/80 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button
            onClick={() => onView(f)}
            className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
          >
            {f.numero}
          </button>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground/90">{f.clientNom}</p>
        </div>
        <FactureStatutBadge statut={f.statut} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Date</dt>
          <dd className="tabular-nums text-foreground/90">{formatDateShort(f.date)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Échéance</dt>
          <dd className={`tabular-nums ${isEchue ? "font-semibold text-red-600 dark:text-red-400" : "text-foreground/90"}`}>
            {formatDateShort(f.dateEcheance)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Montant TTC</dt>
          <dd className="font-semibold tabular-nums text-foreground">{formatFCFA(f.montantTTC)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Payé</dt>
          <dd className="tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">{formatFCFA(f.montantPaye)}</dd>
        </div>
      </dl>
      <div
        className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-border/70 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
          title="Voir la facture"
          onClick={() => onView(f)}
        >
          <Eye className="size-4" />
        </Button>
        {canWrite && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors",
              !isBrouillon && "opacity-40 cursor-not-allowed hover:text-muted-foreground hover:bg-transparent"
            )}
            title={!isBrouillon ? "Seules les factures en brouillon peuvent être modifiées" : "Modifier la facture"}
            disabled={!isBrouillon}
            onClick={() => onEdit(f)}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        {canWrite && isBrouillon && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            title="Marquer comme envoyée"
            onClick={() => onMarkEnvoyee(f)}
          >
            <Send className="size-4" />
          </Button>
        )}
        {canWrite && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
            title="Supprimer la facture"
            onClick={() => onDelete(f)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </Card>
  );
});

const FactureTableRow = memo(function FactureTableRow({
  facture: f,
  canWrite,
  onView,
  onEdit,
  onMarkEnvoyee,
  onDelete,
}: FactureRowProps) {
  const isEchue = isFactureEchue(f);
  const isBrouillon = f.statut === "Brouillon";

  return (
    <TableRow
      className="border-b border-border/70 hover:bg-muted/50 cursor-pointer transition-colors group"
      onClick={() => onView(f)}
    >
      <TableCell className="px-4 py-3.5">
        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 group-hover:underline">
          {f.numero}
        </span>
      </TableCell>
      <TableCell className="max-w-[200px] px-4 py-3.5">
        <p className="truncate text-xs font-medium text-foreground/90" title={f.clientNom}>
          {f.clientNom}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-xs tabular-nums text-muted-foreground">
        {formatDateShort(f.date)}
      </TableCell>
      <TableCell className={`px-4 py-3.5 text-xs tabular-nums ${isEchue ? "font-bold text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
        {isEchue ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
            <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
            {formatDateShort(f.dateEcheance)}
          </span>
        ) : (
          formatDateShort(f.dateEcheance)
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right text-xs font-bold tabular-nums text-foreground">
        {formatFCFA(f.montantTTC)}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
        {formatFCFA(f.montantPaye)}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <FactureStatutBadge statut={f.statut} />
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            title="Voir la facture"
            onClick={() => onView(f)}
          >
            <Eye className="size-4" />
          </Button>
          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-8 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors",
                !isBrouillon && "opacity-40 cursor-not-allowed hover:text-muted-foreground hover:bg-transparent"
              )}
              title={!isBrouillon ? "Seules les factures en brouillon peuvent être modifiées" : "Modifier la facture"}
              disabled={!isBrouillon}
              onClick={() => onEdit(f)}
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {canWrite && isBrouillon && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
              title="Marquer comme envoyée"
              onClick={() => onMarkEnvoyee(f)}
            >
              <Send className="size-4" />
            </Button>
          )}
          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
              title="Supprimer la facture"
              onClick={() => onDelete(f)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

interface FacturesTableProps {
  factures: Facture[];
  totalItems: number;
  hasAnyFacture: boolean;
  canWrite: boolean;
  startIdx: number;
  endIdx: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (f: Facture) => void;
  onEdit: (f: Facture) => void;
  onMarkEnvoyee: (f: Facture) => void;
  onDelete: (f: Facture) => void;
  onCreate: () => void;
}

export function FacturesTable({
  factures,
  totalItems,
  hasAnyFacture,
  canWrite,
  startIdx,
  endIdx,
  page,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onMarkEnvoyee,
  onDelete,
  onCreate,
}: FacturesTableProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 bg-card">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <Receipt className="size-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">Liste des factures</h2>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground border border-border/50">
          {totalItems} résultat{totalItems !== 1 ? "s" : ""}
        </span>
      </div>

      {totalItems === 0 ? (
        <EmptyState
          icon={Receipt}
          title={!hasAnyFacture ? UI.empty.factures.zero.title : UI.empty.factures.filtered.title}
          description={!hasAnyFacture ? UI.empty.factures.zero.description : UI.empty.factures.filtered.description}
          action={
            !hasAnyFacture && canWrite ? (
              <Button variant="outline" size="sm" onClick={onCreate}>
                <Plus className="mr-1.5 size-3.5" /> {UI.empty.factures.zero.action}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {factures.map((f) => (
              <FactureMobileCard
                key={f.id}
                facture={f}
                canWrite={canWrite}
                onView={onView}
                onEdit={onEdit}
                onMarkEnvoyee={onMarkEnvoyee}
                onDelete={onDelete}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table aria-label="Liste des factures">
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-slate-50/75 dark:bg-muted/30 hover:bg-slate-50/75">
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    N° Facture
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Client
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Échéance
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Montant TTC
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Payé
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Statut
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factures.map((f) => (
                  <FactureTableRow
                    key={f.id}
                    facture={f}
                    canWrite={canWrite}
                    onView={onView}
                    onEdit={onEdit}
                    onMarkEnvoyee={onMarkEnvoyee}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            startIdx={startIdx}
            endIdx={endIdx}
            totalItems={totalItems}
            itemLabel={`facture${totalItems !== 1 ? "s" : ""}`}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </Card>
  );
}

