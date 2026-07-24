"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Package, PackageMinus, PackagePlus, Plus, Search } from "lucide-react";
import type { StockItem } from "@/lib/store";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/sltt/table-pagination";
import { StockRow, StockCard } from "./stock-row-card";

const PAGE_SIZE = 8;

export function StockTab({
  stock,
  onEntry,
  onExit,
  onHistory,
  onPrint,
  onExport,
  canWrite = true,
  onCreateItem,
  onOpenClient,
}: {
  stock: StockItem[];
  onEntry: (id: string | null) => void;
  onExit: (id: string | null) => void;
  onHistory: (stockId: string, marchandise: string) => void;
  onPrint: (rows: StockItem[]) => void;
  onExport: (rows: StockItem[]) => void;
  canWrite?: boolean;
  onCreateItem?: () => void;
  onOpenClient?: (clientId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stock;
    return stock.filter((s) =>
      [s.marchandise, s.depositaire, s.commercial, s.unite]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [stock, query]);

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
          Consultez les quantités, valeurs et statuts de chaque référence en stock.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-emerald-600 dark:text-emerald-400 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/40 hover:text-emerald-700"
                onClick={() => onEntry(null)}
              >
                <PackagePlus className="size-4" />
                Entrée
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-amber-600 dark:text-amber-400 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/40 hover:text-amber-700"
                onClick={() => onExit(null)}
              >
                <PackageMinus className="size-4" />
                Sortie
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="h-9" onClick={() => onPrint(filtered)} disabled={filtered.length === 0}>
            <FileText className="size-4" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => onExport(filtered)} disabled={filtered.length === 0}>
            <FileSpreadsheet className="size-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher une marchandise, dépositaire…"
              className="h-10 pl-9"
              aria-label="Rechercher dans le stock"
            />
          </div>
          <SocieteFilterSelect />
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <Package className="size-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {stock.length === 0 ? "Aucun article en stock" : "Aucun résultat"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {stock.length === 0
                ? "Commencez par enregistrer votre première marchandise en entreposage."
                : "Modifiez votre recherche pour retrouver un article."}
            </p>
            {stock.length === 0 && canWrite && onCreateItem && (
              <Button className="mt-5" onClick={onCreateItem}>
                <Plus className="size-4" />
                Ajouter un premier article
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((item) => (
                <StockCard
                  key={item.id}
                  item={item}
                  onEntry={(id) => onEntry(id)}
                  onExit={(id) => onExit(id)}
                  onHistory={(id, m) => onHistory(id, m)}
                  onOpenClient={onOpenClient}
                  canWrite={canWrite}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Marchandise
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Société
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Quantité
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Dépositaire
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">
                      Commercial
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Payé
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Reste dû
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Statut
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((item) => (
                    <StockRow
                      key={item.id}
                      item={item}
                      onEntry={(id) => onEntry(id)}
                      onExit={(id) => onExit(id)}
                      onHistory={(id, m) => onHistory(id, m)}
                      onOpenClient={onOpenClient}
                      canWrite={canWrite}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`article${filtered.length !== 1 ? "s" : ""}`}
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
