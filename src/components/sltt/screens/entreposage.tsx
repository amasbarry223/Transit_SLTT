"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  PackagePlus,
  PackageMinus,
  Plus,
  Wallet,
  ArrowLeftRight,
  AlertTriangle,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  FileSpreadsheet,
  Search,
  ChevronDown,
} from "lucide-react";

import { useStore } from "@/lib/store";
import type { StockItem, StockItemInput } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import type { Mouvement } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { exportToCSV, printHTML, htmlEscape } from "@/lib/export";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge, StockStatutBadge } from "@/components/sltt/status-badge";
import { SocieteFilterSelect, SocieteBadge } from "@/components/sltt/societe-filter-select";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser, usePermission } from "@/hooks/use-permission";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";
import { StockMovementFields } from "@/components/sltt/stock-movement-fields";

const motifs = ["Vente", "Livraison", "Transfert", "Autre"] as const;
type SortieMotif = (typeof motifs)[number];
type EntrepotTab = "stock" | "mouvements";
type MouvementFilter = "all" | "Entrée" | "Sortie";

const PAGE_SIZE = 8;


const tabs: {
  key: EntrepotTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "stock", label: "Inventaire", shortLabel: "Stock", icon: Package },
  {
    key: "mouvements",
    label: "Historique des mouvements",
    shortLabel: "Mouvements",
    icon: History,
  },
];

/* ------------------------------------------------------------------ */
/* STOCK TAB                                                           */
/* ------------------------------------------------------------------ */

function StockTab({
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
  onHistory: (marchandise: string) => void;
  onPrint: () => void;
  onExport: () => void;
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
          <Button variant="outline" size="sm" className="h-9" onClick={onPrint} disabled={stock.length === 0}>
            <FileText className="size-4" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={onExport} disabled={stock.length === 0}>
            <FileSpreadsheet className="size-4" />
            Exporter
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
            <div className="overflow-x-auto">
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
                      onHistory={(m) => onHistory(m)}
                      onOpenClient={onOpenClient}
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

function StockRow({
  item,
  onEntry,
  onExit,
  onHistory,
  onOpenClient,
}: {
  item: StockItem;
  onEntry: (id: string) => void;
  onExit: (id: string) => void;
  onHistory: (marchandise: string) => void;
  onOpenClient?: (clientId: string) => void;
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
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label="Historique"
            title="Historique"
            onClick={() => onHistory(item.marchandise)}
          >
            <History className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/* MOUVEMENTS TAB                                                      */
/* ------------------------------------------------------------------ */

function MouvementsTab({
  mouvements,
  marchandiseFilter,
  onClearMarchandiseFilter,
}: {
  mouvements: Mouvement[];
  marchandiseFilter: string;
  onClearMarchandiseFilter: () => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MouvementFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = mouvements;
    if (marchandiseFilter) {
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
  }, [mouvements, marchandiseFilter, typeFilter, query]);

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
            <div className="overflow-x-auto">
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

/* ------------------------------------------------------------------ */
/* MAIN SCREEN                                                         */
/* ------------------------------------------------------------------ */

export function EntreposageScreen() {
  const { toast } = useToast();
  const openClient = useNav((s) => s.openClient);
  const canWrite = usePermission("stock:write");
  const currentUser = useCurrentUser();
  const allStock = useStore((s) => s.stock);
  const clients = useStore((s) => s.clients);
  const allMouvements = useStore((s) => s.mouvements);
  const societes = useStore((s) => s.societes);
  const addStockEntry = useStore((s) => s.addStockEntry);
  const addStockExit = useStore((s) => s.addStockExit);
  const addStockItem = useStore((s) => s.addStockItem);
  const selectedSocieteId = useNav((s) => s.selectedSocieteId);

  const stock = useMemo(
    () => (selectedSocieteId ? allStock.filter((s) => s.societeId === selectedSocieteId) : allStock),
    [allStock, selectedSocieteId],
  );
  const mouvements = useMemo(
    () => (selectedSocieteId ? allMouvements.filter((m) => m.societeId === selectedSocieteId) : allMouvements),
    [allMouvements, selectedSocieteId],
  );

  const [newItemOpen, setNewItemOpen] = useState(false);
  const [niMarchandise, setNiMarchandise] = useState("");
  const [niUnite, setNiUnite] = useState("");
  const [niQuantite, setNiQuantite] = useState("0");
  const [niSeuil, setNiSeuil] = useState("10");
  const [niDepositaire, setNiDepositaire] = useState("");
  const [niCommercial, setNiCommercial] = useState("");
  const [niSommePayee, setNiSommePayee] = useState("0");
  const [niResteAPayer, setNiResteAPayer] = useState("0");
  const [niClientId, setNiClientId] = useState<string>("");
  const [niSocieteId, setNiSocieteId] = useState<string>("");
  const [niAdvancedOpen, setNiAdvancedOpen] = useState(false);

  function openNewItemDialog() {
    setNiMarchandise("");
    setNiUnite("");
    setNiQuantite("0");
    setNiSeuil("10");
    setNiDepositaire("");
    setNiCommercial("");
    setNiSommePayee("0");
    setNiResteAPayer("0");
    setNiClientId("");
    setNiSocieteId(selectedSocieteId ?? societes[0]?.id ?? "");
    setNiAdvancedOpen(false);
    setNewItemOpen(true);
  }

  function handleAddStockItem() {
    const marchandise = niMarchandise.trim();
    const unite = niUnite.trim();
    if (!marchandise || !unite || !niSocieteId) return;
    const input: StockItemInput = {
      marchandise,
      quantite: Number(niQuantite) || 0,
      unite,
      seuil: Number(niSeuil) || 10,
      depositaire: niDepositaire.trim() || "—",
      commercial: niCommercial.trim() || "—",
      sommePayee: Number(niSommePayee) || 0,
      resteAPayer: Number(niResteAPayer) || 0,
      clientId: niClientId || undefined,
      societeId: niSocieteId,
    };
    addStockItem(input);
    toast({ title: "Article ajouté", description: `${marchandise} ajouté au stock.` });
    setNewItemOpen(false);
  }

  const [activeTab, setActiveTab] = useState<EntrepotTab>("stock");
  const [marchandiseFilter, setMarchandiseFilter] = useState("");

  const [entryOpen, setEntryOpen] = useState(false);
  const [entryStockId, setEntryStockId] = useState<string>("");
  const [entryQty, setEntryQty] = useState<string>("1");
  const [entryResp, setEntryResp] = useState<string>("");

  const [exitOpen, setExitOpen] = useState(false);
  const [exitStockId, setExitStockId] = useState<string>("");
  const [exitQty, setExitQty] = useState<string>("1");
  const [exitResp, setExitResp] = useState<string>("");
  const [exitMotif, setExitMotif] = useState<SortieMotif>("Vente");

  const articlesEnStock = stock.length;
  const valeurStock = stock.reduce(
    (acc, s) => acc + s.sommePayee + s.resteAPayer,
    0,
  );
  const mouvementsCeMois = mouvements.length;
  const alertesStockFaible = stock.filter((s) => s.quantite < s.seuil).length;

  function openEntry(stockId: string | null) {
    const id = stockId ?? stock[0]?.id ?? "";
    setEntryStockId(id);
    setEntryQty("1");
    setEntryResp(currentUser?.nom ?? "");
    setEntryOpen(true);
  }

  function openExit(stockId: string | null) {
    const id = stockId ?? stock[0]?.id ?? "";
    setExitStockId(id);
    setExitQty("1");
    setExitResp(currentUser?.nom ?? "");
    setExitMotif("Vente");
    setExitOpen(true);
  }

  function goToHistory(marchandise: string) {
    setMarchandiseFilter(marchandise);
    setActiveTab("mouvements");
    toast({
      title: `Historique — ${marchandise}`,
      description: "Mouvements filtrés pour cette marchandise.",
    });
  }

  function handleExportStockCSV() {
    if (stock.length === 0) {
      toast({
        title: "Rien à exporter",
        description: "Aucun article en stock pour le moment.",
        variant: "destructive",
      });
      return;
    }
    exportToCSV(
      `inventaire-stock-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "Marchandise", accessor: (s) => s.marchandise },
        { header: "Société", accessor: (s) => s.societeNom },
        { header: "Quantité disponible", accessor: (s) => s.quantite },
        { header: "Unité", accessor: (s) => s.unite },
        { header: "Seuil", accessor: (s) => s.seuil },
        { header: "Dépositaire", accessor: (s) => s.depositaire },
        { header: "Commercial", accessor: (s) => s.commercial },
        { header: "Somme payée (FCFA)", accessor: (s) => s.sommePayee },
        { header: "Reste à payer (FCFA)", accessor: (s) => s.resteAPayer },
        {
          header: "Statut",
          accessor: (s) => (s.quantite < s.seuil ? "Stock faible" : "Disponible"),
        },
      ],
      stock,
      { module: "Stock" },
    );
    toast({
      title: "Inventaire exporté",
      description: `${stock.length} articles exportés en CSV.`,
    });
  }

  function handlePrintStock() {
    const sumPayee = stock.reduce((acc, s) => acc + s.sommePayee, 0);
    const sumReste = stock.reduce((acc, s) => acc + s.resteAPayer, 0);
    const valeurTotale = sumPayee + sumReste;
    const nbFaible = stock.filter((s) => s.quantite < s.seuil).length;
    const nbDisponibles = stock.length - nbFaible;

    const rowsHTML = stock
      .map(
        (s, i) => {
          const faible = s.quantite < s.seuil;
          return `<tr class="${faible ? "row-faible" : ""}">
            <td class="col-num">${i + 1}</td>
            <td>
              <strong class="${faible ? "name-warn" : ""}">${faible ? "⚠ " : ""}${htmlEscape(s.marchandise)}</strong>
            </td>
            <td class="num">${s.quantite}</td>
            <td class="num col-seuil">${s.seuil}</td>
            <td class="col-unit">${htmlEscape(s.unite)}</td>
            <td>${htmlEscape(s.depositaire)}</td>
            <td>${htmlEscape(s.commercial)}</td>
            <td class="num col-payee">${formatFCFA(s.sommePayee, false)}</td>
            <td class="num col-reste">${s.resteAPayer > 0 ? formatFCFA(s.resteAPayer, false) : "—"}</td>
            <td>${faible
              ? '<span class="badge" style="background:#fee2e2;color:#991b1b">Stock faible</span>'
              : '<span class="badge" style="background:#d1fae5;color:#065f46">Disponible</span>'
            }</td>
          </tr>`;
        }
      )
      .join("");

    printHTML(
      "Inventaire du stock",
      `
      <style>
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 32px;
        }
        .kpi-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          border-left: 4px solid;
        }
        .kpi-blue   { border-left-color: #1e40af; }
        .kpi-indigo { border-left-color: #4338ca; }
        .kpi-green  { border-left-color: #059669; }
        .kpi-red    { border-left-color: #dc2626; }
        .kpi-value {
          font-size: 22px; font-weight: 800; color: #0f172a;
          line-height: 1.1; margin-bottom: 4px;
        }
        .kpi-value.sm { font-size: 15px; }
        .kpi-label {
          font-size: 10px; color: #64748b; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .section-header {
          display: flex; align-items: center; gap: 10px;
          margin: 0 0 14px;
        }
        .section-title {
          font-size: 11px; font-weight: 700; color: #1e40af;
          text-transform: uppercase; letter-spacing: 0.08em; margin: 0;
          white-space: nowrap;
        }
        .section-line { flex: 1; height: 1px; background: #dbeafe; }
        .section-count {
          font-size: 11px; color: #64748b; background: #f1f5f9;
          border-radius: 9999px; padding: 2px 8px; font-weight: 500;
          white-space: nowrap;
        }
        .col-num { color: #94a3b8; font-size: 11px; width: 24px; }
        .col-seuil { color: #94a3b8; }
        .col-unit { color: #64748b; font-size: 12px; }
        .col-payee { color: #047857 !important; font-weight: 600; }
        .col-reste { color: #b45309 !important; font-weight: 600; }
        .row-faible td { background: #fffbeb !important; }
        .name-warn { color: #c2410c; }
        .totals-row td {
          font-weight: 700;
          background: #f1f5f9 !important;
          border-top: 2px solid #1e40af !important;
        }
        .legend {
          margin-top: 20px; font-size: 11px; color: #64748b;
          padding: 10px 14px; background: #fefce8;
          border-radius: 6px; border: 1px solid #fde68a;
        }
      </style>

      <h1>Inventaire du stock</h1>
      <div class="subtitle">
        ${stock.length} article${stock.length !== 1 ? "s" : ""} · Édité le ${formatDateShort(new Date())}
      </div>

      <div class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-value">${stock.length}</div>
          <div class="kpi-label">Articles en stock</div>
        </div>
        <div class="kpi-card kpi-indigo">
          <div class="kpi-value sm">${formatFCFA(valeurTotale, false)}</div>
          <div class="kpi-label">Valeur totale (FCFA)</div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-value">${nbDisponibles}</div>
          <div class="kpi-label">Disponibles</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-value">${nbFaible}</div>
          <div class="kpi-label">Stock faible</div>
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title">Inventaire détaillé</h2>
        <div class="section-line"></div>
        <span class="section-count">${stock.length} référence${stock.length !== 1 ? "s" : ""}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:28px">#</th>
            <th>Marchandise</th>
            <th class="num">Qté dispo</th>
            <th class="num">Seuil</th>
            <th>Unité</th>
            <th>Dépositaire</th>
            <th>Commercial</th>
            <th class="num">Somme payée</th>
            <th class="num">Reste à payer</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="7">
              Total général · ${stock.length} article${stock.length !== 1 ? "s" : ""}
            </td>
            <td class="num col-payee">${formatFCFA(sumPayee, false)}</td>
            <td class="num col-reste">${formatFCFA(sumReste, false)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      ${nbFaible > 0 ? `
      <div class="legend">
        ⚠ <strong>${nbFaible} article${nbFaible > 1 ? "s" : ""}</strong>
        ${nbFaible > 1 ? "ont" : "a"} une quantité inférieure au seuil de réapprovisionnement
        et nécessite${nbFaible > 1 ? "nt" : ""} une commande.
      </div>
      ` : ""}
      `,
    );
  }

  async function submitEntry() {
    if (!entryStockId) return;
    const qty = parseInt(entryQty, 10);
    if (!qty || qty <= 0) return;
    try {
      await addStockEntry(entryStockId, qty, entryResp.trim() || currentUser?.nom || "Système");
      toast({ title: "Entrée enregistrée — stock mis à jour" });
      setEntryOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer l'entrée.",
        variant: "destructive",
      });
    }
  }

  async function submitExit() {
    if (!exitStockId) return;
    const qty = parseInt(exitQty, 10);
    if (!qty || qty <= 0) return;
    const item = stock.find((s) => s.id === exitStockId);
    if (!item || qty > item.quantite) return;
    try {
      await addStockExit(exitStockId, qty, exitResp.trim() || currentUser?.nom || "Système", undefined, exitMotif);
      toast({ title: "Sortie enregistrée — stock décrémenté" });
      setExitOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer la sortie.",
        variant: "destructive",
      });
    }
  }

  const entryQtyNum = parseInt(entryQty, 10) || 0;
  const entryDisabled = !entryStockId || entryQtyNum <= 0;

  const exitStock = stock.find((s) => s.id === exitStockId);
  const exitQtyNum = parseInt(exitQty, 10) || 0;
  const exitOverflow = exitStock != null && exitQtyNum > exitStock.quantite;
  const exitDisabled = !exitStockId || exitQtyNum <= 0 || exitOverflow;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entreposage"
        description="Gestion du stock et des mouvements"
      >
        {canWrite && (
          <Button onClick={openNewItemDialog}>
            <Plus className="size-4" />
            Nouvel article
          </Button>
        )}
      </PageHeader>

      {alertesStockFaible > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/80 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-900">
              {alertesStockFaible} article{alertesStockFaible > 1 ? "s" : ""} en
              stock faible
            </p>
            <p className="mt-0.5 text-xs text-red-700/80">
              Pensez à réapprovisionner ou à enregistrer une entrée de marchandise.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Articles en stock"
          value={String(articlesEnStock)}
          icon={Package}
          tone="blue"
          sublabel="références distinctes"
        />
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Wallet}
          tone="indigo"
          sublabel="valeur totale"
        />
        <KpiCard
          label="Mouvements ce mois"
          value={String(mouvementsCeMois)}
          icon={ArrowLeftRight}
          tone="emerald"
          sublabel="entrées et sorties"
        />
        <KpiCard
          label="Alertes stock faible"
          value={String(alertesStockFaible)}
          icon={AlertTriangle}
          tone="red"
          sublabel="à réapprovisionner"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as EntrepotTab)}
        className="gap-0"
      >
        <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 pb-0 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <TabsList
            className={cn(
              "h-auto w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0",
              "scrollbar-none [&::-webkit-scrollbar]:hidden",
            )}
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const count =
                t.key === "stock" ? stock.length : mouvements.length;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    "relative shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-3",
                    "text-sm font-medium text-slate-500 dark:text-slate-400 shadow-none transition-colors",
                    "hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:border-primary data-[state=active]:bg-transparent",
                    "data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.shortLabel}</span>
                  <span className="ml-1.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <Separator />
        </div>

        <TabsContent value="stock" className="mt-6 focus-visible:outline-none">
          <StockTab
            stock={stock}
            onEntry={openEntry}
            onExit={openExit}
            onHistory={goToHistory}
            onPrint={handlePrintStock}
            onExport={handleExportStockCSV}
            canWrite={canWrite}
            onCreateItem={openNewItemDialog}
            onOpenClient={openClient}
          />
        </TabsContent>

        <TabsContent value="mouvements" className="mt-6 focus-visible:outline-none">
          <MouvementsTab
            key={marchandiseFilter}
            mouvements={mouvements}
            marchandiseFilter={marchandiseFilter}
            onClearMarchandiseFilter={() => setMarchandiseFilter("")}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entrée de marchandise</DialogTitle>
            <DialogDescription className="sr-only">
              Enregistrer une entrée de stock et mettre à jour la quantité
              disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-marchandise" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Marchandise
              </Label>
              <Select value={entryStockId} onValueChange={setEntryStockId}>
                <SelectTrigger id="entry-marchandise" className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une marchandise" />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.marchandise} (stock : {s.quantite} {s.unite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <StockMovementFields
              idPrefix="entry"
              qty={entryQty}
              onQtyChange={setEntryQty}
              responsable={entryResp}
              onResponsableChange={setEntryResp}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEntryOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submitEntry} disabled={entryDisabled}>
              Valider l&apos;entrée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sortie de marchandise</DialogTitle>
            <DialogDescription className="sr-only">
              Enregistrer une sortie de stock et décrémenter la quantité
              disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exit-marchandise" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Marchandise
              </Label>
              <Select value={exitStockId} onValueChange={setExitStockId}>
                <SelectTrigger id="exit-marchandise" className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une marchandise" />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.marchandise} (stock : {s.quantite} {s.unite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-qty" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Quantité à sortir
              </Label>
              <Input
                id="exit-qty"
                type="number"
                min={1}
                value={exitQty}
                onChange={(e) => setExitQty(e.target.value)}
                className="h-10"
                aria-invalid={exitOverflow}
              />
              {exitOverflow && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  La quantité dépasse le stock disponible ({exitStock?.quantite}{" "}
                  {exitStock?.unite}).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-resp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Responsable
              </Label>
              <Input
                id="exit-resp"
                value={exitResp}
                onChange={(e) => setExitResp(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-motif" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Motif
              </Label>
              <Select
                value={exitMotif}
                onValueChange={(v) => setExitMotif(v as SortieMotif)}
              >
                <SelectTrigger id="exit-motif" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {motifs.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setExitOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submitExit} disabled={exitDisabled}>
              Valider la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Nouvel article */}
      <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvel article</DialogTitle>
            <DialogDescription>
              Enregistrez un nouveau type de marchandise dans le stock.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="ni-marchandise" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Marchandise <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ni-marchandise"
                value={niMarchandise}
                onChange={(e) => setNiMarchandise(e.target.value)}
                placeholder="ex. Riz parfumé 25 kg"
                className="h-10"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Société <span className="text-red-500">*</span>
              </Label>
              <Select value={niSocieteId} onValueChange={setNiSocieteId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une société" />
                </SelectTrigger>
                <SelectContent>
                  {societes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Client (optionnel)
              </Label>
              <Select value={niClientId || "none"} onValueChange={(v) => setNiClientId(v === "none" ? "" : v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Lier à un client…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ni-unite" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Unité <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ni-unite"
                value={niUnite}
                onChange={(e) => setNiUnite(e.target.value)}
                placeholder="ex. sacs, kg, L"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ni-quantite" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Quantité initiale
              </Label>
              <Input
                id="ni-quantite"
                type="number"
                min={0}
                value={niQuantite}
                onChange={(e) => setNiQuantite(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ni-seuil" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Seuil d&apos;alerte
              </Label>
              <Input
                id="ni-seuil"
                type="number"
                min={0}
                value={niSeuil}
                onChange={(e) => setNiSeuil(e.target.value)}
                className="h-10"
              />
            </div>

          </div>

          <button
            type="button"
            onClick={() => setNiAdvancedOpen((v) => !v)}
            aria-expanded={niAdvancedOpen}
            className="flex w-full items-center justify-between gap-2 border-t border-border pt-3 text-left text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Dépositaire, commercial et paiement (optionnel)
            <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", niAdvancedOpen && "rotate-180")} />
          </button>

          {niAdvancedOpen && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ni-depositaire" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dépositaire
                </Label>
                <Input
                  id="ni-depositaire"
                  value={niDepositaire}
                  onChange={(e) => setNiDepositaire(e.target.value)}
                  placeholder="Nom du dépositaire"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ni-commercial" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Commercial
                </Label>
                <Input
                  id="ni-commercial"
                  value={niCommercial}
                  onChange={(e) => setNiCommercial(e.target.value)}
                  placeholder="Nom du commercial"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ni-payee" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Somme payée (FCFA)
                </Label>
                <Input
                  id="ni-payee"
                  type="number"
                  min={0}
                  value={niSommePayee}
                  onChange={(e) => setNiSommePayee(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ni-reste" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Reste à payer (FCFA)
                </Label>
                <Input
                  id="ni-reste"
                  type="number"
                  min={0}
                  value={niResteAPayer}
                  onChange={(e) => setNiResteAPayer(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewItemOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddStockItem}
              disabled={!niMarchandise.trim() || !niUnite.trim() || !niSocieteId}
            >
              <Plus className="size-4" />
              Ajouter au stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
