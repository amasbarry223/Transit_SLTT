"use client";

import { Eye, Plus, Receipt, Send, Trash2 } from "lucide-react";
import type { Facture } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { FactureStatutBadge } from "@/components/sltt/status-badge";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { EmptyState } from "@/components/sltt/empty-state";
import { UI } from "@/lib/ui-messages";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  onView: () => void;
  onMarkEnvoyee: () => void;
  onDelete: () => void;
}

function FactureMobileCard({ facture: f, canWrite, onView, onMarkEnvoyee, onDelete }: FactureRowProps) {
  const isEchue = isFactureEchue(f);

  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button
            onClick={onView}
            className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
          >
            {f.numero}
          </button>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground/90">{f.clientNom}</p>
        </div>
        <FactureStatutBadge statut={f.statut} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Société</dt>
          <dd><SocieteBadge societeNom={f.societeNom} size="sm" /></dd>
        </div>
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
          <dd className="tabular-nums text-emerald-700 dark:text-emerald-300">{formatFCFA(f.montantPaye)}</dd>
        </div>
      </dl>
      <div
        className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Voir / Imprimer"
          onClick={onView}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-slate-700 dark:hover:text-slate-300"
        >
          <Eye className="size-4" />
        </button>
        {canWrite && f.statut === "Brouillon" && (
          <button
            title="Marquer comme envoyée"
            onClick={onMarkEnvoyee}
            className="rounded p-1.5 text-muted-foreground hover:bg-blue-50 dark:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Send className="size-4" />
          </button>
        )}
        {canWrite && (
          <button
            title="Supprimer"
            onClick={onDelete}
            className="rounded p-1.5 text-muted-foreground hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

function FactureTableRow({ facture: f, canWrite, onView, onMarkEnvoyee, onDelete }: FactureRowProps) {
  const isEchue = isFactureEchue(f);

  return (
    <TableRow className="border-b border-border hover:bg-muted/60">
      <TableCell className="px-4 py-3.5">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
        >
          {f.numero}
        </button>
      </TableCell>
      <TableCell className="max-w-[180px] px-4 py-3.5">
        <p className="truncate text-xs text-foreground/90">{f.clientNom}</p>
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <SocieteBadge societeNom={f.societeNom} size="sm" />
      </TableCell>
      <TableCell className="px-4 py-3.5 text-xs tabular-nums text-muted-foreground">
        {formatDateShort(f.date)}
      </TableCell>
      <TableCell className={`px-4 py-3.5 text-xs tabular-nums ${isEchue ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
        {formatDateShort(f.dateEcheance)}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right text-xs font-semibold tabular-nums text-foreground">
        {formatFCFA(f.montantTTC)}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right text-xs tabular-nums text-emerald-700 dark:text-emerald-300">
        {formatFCFA(f.montantPaye)}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <FactureStatutBadge statut={f.statut} />
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            title="Voir / Imprimer"
            onClick={onView}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Eye className="size-3.5" />
          </button>
          {canWrite && f.statut === "Brouillon" && (
            <button
              title="Marquer comme envoyée"
              onClick={onMarkEnvoyee}
              className="rounded p-1 text-muted-foreground hover:bg-blue-50 dark:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Send className="size-3.5" />
            </button>
          )}
          {canWrite && (
            <button
              title="Supprimer"
              onClick={onDelete}
              className="rounded p-1 text-muted-foreground hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

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
  onMarkEnvoyee,
  onDelete,
  onCreate,
}: FacturesTableProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Receipt className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Liste des factures</h2>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
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
                onView={() => onView(f)}
                onMarkEnvoyee={() => onMarkEnvoyee(f)}
                onDelete={() => onDelete(f)}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table aria-label="Liste des factures">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 hover:bg-muted">
                  <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    N° Facture
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Client
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Société
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Échéance
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Montant TTC
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Payé
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Statut
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                    onView={() => onView(f)}
                    onMarkEnvoyee={() => onMarkEnvoyee(f)}
                    onDelete={() => onDelete(f)}
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
