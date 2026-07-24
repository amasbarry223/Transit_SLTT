"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, History, Search } from "lucide-react";
import type { Mouvement } from "@/lib/domain-types";
import { formatDateShort } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { SocieteFilterSelect, SocieteBadge } from "@/components/sltt/societe-filter-select";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/sltt/table-pagination";

const PAGE_SIZE = 8;

type MouvementFilter = "all" | "Entrée" | "Sortie";

export function MouvementsTab({
  mouvements,
  marchandiseFilter,
  stockIdFilter,
  onClearMarchandiseFilter,
}: {
  mouvements: Mouvement[];
  marchandiseFilter: string;
  stockIdFilter: string;
  onClearMarchandiseFilter: () => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MouvementFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = mouvements;
    if (stockIdFilter) {
      // Filtre par article précis (stockId) — évite de mélanger deux articles
      // de sociétés différentes portant le même nom de marchandise. Les
      // mouvements plus anciens sans stockId retombent sur le nom seul.
      list = list.filter((m) => (m.stockId ? m.stockId === stockIdFilter : m.marchandise === marchandiseFilter));
    } else if (marchandiseFilter) {
      list = list.filter((m) => m.marchandise === marchandiseFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((m) => m.type === typeFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((m) =>
        [m.marchandise, m.responsable, m.bonRef, m.type]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [mouvements, marchandiseFilter, stockIdFilter, typeFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Suivez toutes les entrées et sorties de marchandises enregistrées.
        </p>
        {marchandiseFilter && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={() => {
              onClearMarchandiseFilter();
              setPage(1);
            }}
          >
            Tout afficher
          </Button>
        )}
      </div>

      {marchandiseFilter && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          <History className="size-4 shrink-0" />
          Filtré sur : <span className="font-medium">{marchandiseFilter}</span>
        </div>
      )}

      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un mouvement…"
              className="h-10 pl-9"
              aria-label="Rechercher un mouvement"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as MouvementFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Entrée">Entrées</SelectItem>
              <SelectItem value="Sortie">Sorties</SelectItem>
            </SelectContent>
          </Select>
          <SocieteFilterSelect className="w-full sm:w-40" />
          <p className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {filtered.length} mouvement{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            Aucun mouvement ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((m) => {
                const isEntree = m.type === "Entrée";
                const hasBon = m.bonRef && m.bonRef !== "—";
                return (
                  <Card key={m.id} className="border-border/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{m.marchandise}</p>
                        <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDateShort(m.date)}</p>
                      </div>
                      <ToneBadge tone={isEntree ? "emerald" : "amber"} dot={false} className="gap-1">
                        {isEntree ? <ArrowDownToLine className="size-3" /> : <ArrowUpFromLine className="size-3" />}
                        {m.type}
                      </ToneBadge>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Société</dt>
                        <dd><SocieteBadge societeNom={m.societeNom} size="sm" /></dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Quantité</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">{m.quantite} {m.unite}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Responsable</dt>
                        <dd className="text-slate-700 dark:text-slate-300">{m.responsable}</dd>
                      </div>
                      {hasBon && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Bon lié</dt>
                          <dd className="font-mono text-xs text-primary">{m.bonRef}</dd>
                        </div>
                      )}
                      {m.motif && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Motif</dt>
                          <dd className="text-right text-slate-700 dark:text-slate-300">{m.motif}</dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Type
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Marchandise
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Société
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Quantité
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Responsable
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Bon lié
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">
                      Motif
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((m) => {
                    const isEntree = m.type === "Entrée";
                    const hasBon = m.bonRef && m.bonRef !== "—";
                    return (
                      <TableRow
                        key={m.id}
                        className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                      >
                        <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                          {formatDateShort(m.date)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <ToneBadge
                            tone={isEntree ? "emerald" : "amber"}
                            dot={false}
                            className="gap-1"
                          >
                            {isEntree ? (
                              <ArrowDownToLine className="size-3" />
                            ) : (
                              <ArrowUpFromLine className="size-3" />
                            )}
                            {m.type}
                          </ToneBadge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                          {m.marchandise}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                          <SocieteBadge societeNom={m.societeNom} size="sm" />
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {m.quantite} {m.unite}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-slate-600 dark:text-slate-300 sm:table-cell">
                          {m.responsable}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 md:table-cell">
                          {hasBon ? (
                            <span className="cursor-pointer font-mono text-xs text-primary hover:underline">
                              {m.bonRef}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-slate-600 dark:text-slate-300 lg:table-cell">
                          {m.motif ?? <span className="text-slate-400 dark:text-slate-500">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`mouvement${filtered.length !== 1 ? "s" : ""}`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
