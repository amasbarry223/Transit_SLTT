"use client";

import { useState } from "react";
import { FileSpreadsheet, Printer, History, TrendingUp, Wallet, Clock, Upload, Table2 } from "lucide-react";
import type { AuditEntry } from "@/lib/audit";
import type { ClasseurEntry, ClasseurFilters, ClasseurTotals } from "@/lib/classeur";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TabEmptyState, classeurStatutTone } from "./shared";
import { ClasseurGrid } from "./classeur-grid";
import { ExcelWorkbookLazy } from "@/components/sltt/excel/excel-workbook-lazy";

type ClasseurViewMode = "grand-livre" | "excel";

type ClasseurTabProps = {
  clientId: string;
  clientNom: string;
  journalEntries: ClasseurEntry[];
  classeurFilters: ClasseurFilters;
  onFiltersChange: (updater: (prev: ClasseurFilters) => ClasseurFilters) => void;
  classeurSocieteOptions: { id: string; nom: string }[];
  classeurFiltered: ClasseurEntry[];
  classeurTotals: ClasseurTotals;
  classeurPeriodFiltered?: boolean;
  isSyncing?: boolean;
  clientAuditHistory: AuditEntry[];
  onExportExcel: () => void;
  onOpenImport?: () => void;
  onPrint: () => void;
  onRowClick: (entry: ClasseurEntry) => void;
  onGridDataChanged?: () => void;
  canImport?: boolean;
};

export function ClasseurTab({
  clientId,
  clientNom,
  journalEntries,
  classeurFilters,
  onFiltersChange,
  classeurSocieteOptions,
  classeurFiltered,
  classeurTotals,
  classeurPeriodFiltered = false,
  isSyncing = false,
  clientAuditHistory,
  onExportExcel,
  onOpenImport,
  onPrint,
  onRowClick,
  onGridDataChanged,
  canImport = false,
}: ClasseurTabProps) {
  const [viewMode, setViewMode] = useState<ClasseurViewMode>("grand-livre");

  return (
    <TabsContent value="classeur" className="mt-6 space-y-4 focus-visible:outline-none">
      <div className="inline-flex overflow-hidden rounded-md border border-[#c8c8c8] bg-[#f3f3f3] p-0.5 shadow-sm">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded px-3 py-1.5 text-[13px] font-medium transition-colors",
            viewMode === "grand-livre"
              ? "bg-white text-[#185c37] shadow-sm ring-1 ring-[#d0d0d0]"
              : "text-[#605e5c] hover:bg-white/70 hover:text-[#323130]",
          )}
          onClick={() => setViewMode("grand-livre")}
        >
          <Table2 className="size-4" />
          Grand livre
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded px-3 py-1.5 text-[13px] font-semibold transition-colors",
            viewMode === "excel"
              ? "bg-[#217346] text-white shadow-sm"
              : "text-[#605e5c] hover:bg-white/70 hover:text-[#217346]",
          )}
          onClick={() => setViewMode("excel")}
        >
          <FileSpreadsheet className="size-4" />
          Excel
        </button>
      </div>

      {viewMode === "excel" ? (
        <ExcelWorkbookLazy
          clientId={clientId}
          clientNom={clientNom}
          journalEntries={journalEntries}
          onApplied={onGridDataChanged}
        />
      ) : (
      <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          value={classeurFilters.societeId === "" ? "none" : classeurFilters.societeId}
          onValueChange={(v) =>
            onFiltersChange((f) => ({ ...f, societeId: v === "none" ? "" : v }))
          }
        >
          <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Filtrer par société">
            <SelectValue placeholder="Société" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sociétés</SelectItem>
            {classeurSocieteOptions.map((s) => (
              <SelectItem key={s.id || "none"} value={s.id || "none"}>
                {s.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={classeurFilters.type}
          onValueChange={(v) =>
            onFiltersChange((f) => ({ ...f, type: v as ClasseurFilters["type"] }))
          }
        >
          <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrer par type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="Dossier">Dossier</SelectItem>
            <SelectItem value="Paiement">Paiement</SelectItem>
            <SelectItem value="Facture">Facture</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="date"
            className="h-10 w-full sm:w-[150px]"
            value={classeurFilters.dateFrom ?? ""}
            onChange={(e) =>
              onFiltersChange((f) => ({ ...f, dateFrom: e.target.value || undefined }))
            }
            aria-label="Date de début"
          />
          <span className="hidden text-sm text-slate-400 sm:inline">→</span>
          <Input
            type="date"
            className="h-10 w-full sm:w-[150px]"
            value={classeurFilters.dateTo ?? ""}
            onChange={(e) =>
              onFiltersChange((f) => ({ ...f, dateTo: e.target.value || undefined }))
            }
            aria-label="Date de fin"
          />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {canImport && onOpenImport && (
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={onOpenImport}
              title="Importer un Excel"
            >
              <Upload className="size-4" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={onExportExcel}
            disabled={classeurFiltered.length === 0}
            title="Exporter en Excel"
            aria-label="Exporter en Excel"
          >
            <FileSpreadsheet className="size-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={onPrint}
            disabled={classeurFiltered.length === 0}
          >
            <Printer className="size-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {isSyncing && (
        <p className="text-xs text-slate-400 dark:text-slate-500">Synchronisation…</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total débit"
          value={formatFCFA(classeurTotals.totalDebit)}
          icon={TrendingUp}
          tone="indigo"
          sublabel="engagé (sélection filtrée)"
        />
        <KpiCard
          label="Total crédit"
          value={formatFCFA(classeurTotals.totalCredit)}
          icon={Wallet}
          tone="emerald"
          sublabel="payé (sélection filtrée)"
        />
        <KpiCard
          label="Solde net"
          value={formatFCFA(classeurTotals.soldeNet)}
          icon={Clock}
          tone={classeurTotals.soldeNet > 0 ? "amber" : "emerald"}
          sublabel="reste dû (sélection filtrée)"
        />
      </div>

      {classeurTotals.parSociete.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Solde par société (sélection filtrée) :
          </span>
          {classeurTotals.parSociete.map((p) => (
            <ToneBadge key={p.societeNom} tone={p.soldeNet > 0 ? "amber" : "emerald"}>
              {p.societeNom} · {formatFCFA(p.soldeNet)}
            </ToneBadge>
          ))}
        </div>
      )}

      {classeurPeriodFiltered && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Le solde cumulé affiché est calculé sur l&apos;historique complet du client (hors filtre
          période).
        </p>
      )}

      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        {classeurFiltered.length === 0 ? (
          <TabEmptyState label="Aucun mouvement pour ce client sur cette sélection." />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {classeurFiltered.map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
                  onClick={() => onRowClick(entry)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                        {entry.reference}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {entry.type} · {entry.societeNom}
                      </p>
                    </div>
                    <ToneBadge tone={classeurStatutTone(entry.statut)}>{entry.statut}</ToneBadge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Date</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                        {formatDateShort(entry.date)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Libellé</dt>
                      <dd className="truncate text-right text-slate-700 dark:text-slate-300">
                        {entry.libelle}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Débit</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                        {entry.debit > 0 ? formatFCFA(entry.debit) : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Crédit</dt>
                      <dd className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                        {entry.credit > 0 ? formatFCFA(entry.credit) : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Solde cumulé</dt>
                      <dd
                        className={cn(
                          "tabular-nums font-semibold",
                          entry.soldeCumule > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {formatFCFA(entry.soldeCumule)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
            <div className="hidden p-2 md:block">
              <ClasseurGrid
                rows={classeurFiltered}
                onRowClick={onRowClick}
                onDataChanged={onGridDataChanged}
              />
            </div>
          </>
        )}
      </Card>

      <Card className="border-border/80 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <History className="size-4 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Suivi des mouvements
          </p>
        </div>
        {clientAuditHistory.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun historique enregistré pour ce client.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {clientAuditHistory.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-slate-700 dark:text-slate-300">{a.detail}</p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {a.module} · {a.action} · {a.user}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
                  {formatDateShort(a.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      </>
      )}
    </TabsContent>
  );
}
