"use client";

import { Download, Printer, History, TrendingUp, Wallet, Clock } from "lucide-react";
import type { AuditEntry } from "@/lib/audit";
import type { ClasseurEntry, ClasseurFilters, ClasseurTotals } from "@/lib/classeur";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge } from "@/components/sltt/status-badge";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TabEmptyState, classeurStatutTone } from "./shared";

type ClasseurTabProps = {
  classeurFilters: ClasseurFilters;
  onFiltersChange: (updater: (prev: ClasseurFilters) => ClasseurFilters) => void;
  classeurSocieteOptions: { id: string; nom: string }[];
  classeurFiltered: ClasseurEntry[];
  classeurTotals: ClasseurTotals;
  classeurPeriodFiltered?: boolean;
  clientAuditHistory: AuditEntry[];
  onExportCsv: () => void;
  onPrint: () => void;
  onRowClick: (entry: ClasseurEntry) => void;
};

export function ClasseurTab({
  classeurFilters,
  onFiltersChange,
  classeurSocieteOptions,
  classeurFiltered,
  classeurTotals,
  classeurPeriodFiltered = false,
  clientAuditHistory,
  onExportCsv,
  onPrint,
  onRowClick,
}: ClasseurTabProps) {
  return (
    <TabsContent value="classeur" className="mt-6 space-y-4 focus-visible:outline-none">
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
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="h-10 w-[150px]"
            value={classeurFilters.dateFrom ?? ""}
            onChange={(e) =>
              onFiltersChange((f) => ({ ...f, dateFrom: e.target.value || undefined }))
            }
            aria-label="Date de début"
          />
          <span className="text-sm text-slate-400">→</span>
          <Input
            type="date"
            className="h-10 w-[150px]"
            value={classeurFilters.dateTo ?? ""}
            onChange={(e) =>
              onFiltersChange((f) => ({ ...f, dateTo: e.target.value || undefined }))
            }
            aria-label="Date de fin"
          />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={onExportCsv}
            disabled={classeurFiltered.length === 0}
          >
            <Download className="size-4" />
            Export CSV
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
                        <dt className="text-xs text-slate-500">Date</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                          {formatDateShort(entry.date)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Libellé</dt>
                        <dd className="truncate text-right text-slate-700 dark:text-slate-300">
                          {entry.libelle}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Débit</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                          {entry.debit > 0 ? formatFCFA(entry.debit) : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Crédit</dt>
                        <dd className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                          {entry.credit > 0 ? formatFCFA(entry.credit) : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Solde cumulé</dt>
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
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Société
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Type
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Référence
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">
                      Libellé
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Débit
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Crédit
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Solde
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classeurFiltered.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                        onClick={() => onRowClick(entry)}
                      >
                        <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                          {formatDateShort(entry.date)}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                          <SocieteBadge societeNom={entry.societeNom} size="sm" />
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 md:table-cell">
                          {entry.type}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                          {entry.reference}
                        </TableCell>
                        <TableCell className="hidden max-w-[220px] px-4 py-3.5 lg:table-cell">
                          <span className="line-clamp-1 text-sm text-slate-600 dark:text-slate-300">
                            {entry.libelle}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {entry.debit > 0 ? formatFCFA(entry.debit) : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                          {entry.credit > 0 ? formatFCFA(entry.credit) : "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "px-4 py-3.5 text-right tabular-nums font-semibold",
                            entry.soldeCumule > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {formatFCFA(entry.soldeCumule)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <ToneBadge tone={classeurStatutTone(entry.statut)}>{entry.statut}</ToneBadge>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </TabsContent>
  );
}
