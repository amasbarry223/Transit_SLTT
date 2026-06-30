"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileText,
  FileSpreadsheet,
  Eye,
  Pencil,
  FolderKanban,
  Clock,
  CheckCircle2,
  TrendingUp,
  Truck,
  ArrowUpDown,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { calculerEcart, type DossierStatut } from "@/lib/mock-data";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { exportToCSV, printHTML } from "@/lib/export";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { DossierStatutBadge, EcartValue } from "@/components/sltt/status-badge";
import {
  TransitionDialog,
  getNextTransition,
  TRANSITION_META,
} from "@/components/sltt/dossier-transition-dialog";
import { useToast } from "@/hooks/use-toast";

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
import { cn } from "@/lib/utils";
import type { Dossier } from "@/lib/mock-data";
import { TablePagination } from "@/components/sltt/table-pagination";

const PAGE_SIZE = 8;

const STATUT_OPTIONS: (DossierStatut | "Tous")[] = [
  "Tous",
  "En cours",
  "Dédouané",
  "Livré",
  "Soldé",
];

type SortKey =
  | "date-desc"
  | "date-asc"
  | "reference"
  | "client"
  | "montant-desc"
  | "montant-asc"
  | "statut"
  | "ecart-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Date (récent d'abord)" },
  { value: "date-asc", label: "Date (ancien d'abord)" },
  { value: "reference", label: "Référence A → Z" },
  { value: "client", label: "Client A → Z" },
  { value: "montant-desc", label: "Montant (décroissant)" },
  { value: "montant-asc", label: "Montant (croissant)" },
  { value: "statut", label: "Statut" },
  { value: "ecart-desc", label: "Écart (décroissant)" },
];



export function DossiersListScreen() {
  const { openDossier, openDossierDetail } = useNav();
  const { toast } = useToast();
  const dossiers = useStore((s) => s.dossiers);
  const clients = useStore((s) => s.clients);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("Tous");
  const [periode, setPeriode] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);

  // Ancrage temporel sur la date la plus récente des données (cohérent avec le dashboard)
  const refDate = useMemo(() => {
    if (dossiers.length === 0) return new Date();
    const max = dossiers.reduce((a, b) => (a.date > b.date ? a : b)).date;
    return new Date(max);
  }, [dossiers]);

  const availableYears = useMemo(() => {
    const years = new Set(dossiers.map((d) => d.date.slice(0, 4)).filter(Boolean));
    return [...years].sort().reverse();
  }, [dossiers]);

  // Quick-action transition dialog
  const [transitionDossier, setTransitionDossier] = useState<Dossier | null>(null);

  const stats = useMemo(() => {
    let enCours = 0;
    let soldes = 0;
    let ecartTotal = 0;
    for (const d of dossiers) {
      if (d.statut === "En cours") enCours++;
      if (d.statut === "Soldé") soldes++;
      ecartTotal += calculerEcart(d);
    }
    return { total: dossiers.length, enCours, soldes, ecartTotal };
  }, [dossiers]);

  const filtered = useMemo(() => {
    const list = dossiers.filter((d) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack =
          `${d.reference} ${d.clientNom} ${d.bl} ${d.camion} ${d.nature}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (clientFilter !== "all" && d.clientId !== clientFilter) return false;
      if (statutFilter !== "Tous" && d.statut !== statutFilter) return false;
      if (yearFilter !== "all" && d.date.slice(0, 4) !== yearFilter) return false;
      if (periode !== "all") {
        const dDate = new Date(d.date);
        const diffDays = (refDate.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24);
        if (periode === "month" && (diffDays > 31 || diffDays < 0)) return false;
        if (periode === "quarter" && (diffDays > 92 || diffDays < 0)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":   return b.date.localeCompare(a.date);
        case "date-asc":    return a.date.localeCompare(b.date);
        case "reference":   return a.reference.localeCompare(b.reference);
        case "client":      return a.clientNom.localeCompare(b.clientNom, "fr");
        case "montant-desc": return b.montantInvesti - a.montantInvesti;
        case "montant-asc":  return a.montantInvesti - b.montantInvesti;
        case "statut":      return a.statut.localeCompare(b.statut);
        case "ecart-desc":  return calculerEcart(b) - calculerEcart(a);
        default: return 0;
      }
    });
  }, [dossiers, search, clientFilter, statutFilter, periode, yearFilter, sortBy, refDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const activeFiltersCount = [
    search.trim() !== "",
    clientFilter !== "all",
    statutFilter !== "Tous",
    periode !== "all",
    yearFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  function clearFilters() {
    setSearch("");
    setClientFilter("all");
    setStatutFilter("Tous");
    setPeriode("all");
    setYearFilter("all");
    setSortBy("date-desc");
    setPage(1);
  }

  function handleExportExcel() {
    exportToCSV(
      `dossiers-transit-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "Référence", accessor: (d) => d.reference },
        { header: "Client", accessor: (d) => d.clientNom },
        { header: "N° BL", accessor: (d) => d.bl },
        { header: "N° camion", accessor: (d) => d.camion },
        { header: "Nature marchandise", accessor: (d) => d.nature },
        { header: "Droit de douane (FCFA)", accessor: (d) => d.droitDouane },
        { header: "Frais circuit (FCFA)", accessor: (d) => d.fraisCircuit },
        { header: "Frais prestation (FCFA)", accessor: (d) => d.fraisPrestation },
        { header: "Montant investi (FCFA)", accessor: (d) => d.montantInvesti },
        { header: "Montant payé (FCFA)", accessor: (d) => d.montantPaye },
        {
          header: "Reste à payer (FCFA)",
          accessor: (d) => Math.max(0, d.montantInvesti - d.montantPaye),
        },
        { header: "Écart (FCFA)", accessor: (d) => calculerEcart(d) },
        { header: "Statut", accessor: (d) => d.statut },
        { header: "Date", accessor: (d) => formatDateShort(d.date) },
      ],
      filtered,
    );
    toast({
      title: "Export Excel généré",
      description: `${filtered.length} dossiers exportés en CSV.`,
    });
  }

  function handleExportPDF() {
    const rowsHTML = filtered
      .map(
        (d) => `<tr>
          <td>${d.reference}</td>
          <td>${d.clientNom}</td>
          <td>${d.bl}</td>
          <td>${d.camion}</td>
          <td>${d.nature}</td>
          <td class="num">${formatFCFA(d.fraisPrestation, false)}</td>
          <td class="num">${calculerEcart(d).toLocaleString("fr-FR")}</td>
          <td><span class="badge" style="background:#dbeafe;color:#1e3a8a">${d.statut}</span></td>
        </tr>`,
      )
      .join("");
    printHTML(
      "Liste des dossiers de transit",
      `
      <h1>Dossiers de transit</h1>
      <div class="subtitle">${filtered.length} dossier(s) · ${formatDateShort(new Date())}</div>
      <table>
        <thead><tr>
          <th>Référence</th><th>Client</th><th>N° BL</th><th>Camion</th>
          <th>Nature</th><th class="num">Prestation</th><th class="num">Écart</th><th>Statut</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    `,
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers de transit"
        description="Suivi des dossiers douaniers et de leur soldage"
      >
        <Button onClick={() => openDossier(null, "create")}>
          <Plus className="size-4" />
          Nouveau dossier
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total dossiers"
          value={String(stats.total)}
          icon={FolderKanban}
          tone="blue"
          sublabel="dossiers enregistrés"
        />
        <KpiCard
          label="En cours"
          value={String(stats.enCours)}
          icon={Clock}
          tone="amber"
          sublabel="en traitement douanier"
        />
        <KpiCard
          label="Soldés"
          value={String(stats.soldes)}
          icon={CheckCircle2}
          tone="emerald"
          sublabel="dossiers clôturés"
        />
        <KpiCard
          label="Écart cumulé"
          value={formatFCFA(stats.ecartTotal)}
          icon={TrendingUp}
          tone="indigo"
          sublabel="prestation vs payé"
        />
      </div>

      {stats.enCours > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/60 px-4 py-3">
          <Truck className="mt-0.5 size-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {stats.enCours} dossier{stats.enCours > 1 ? "s" : ""} en cours
              de traitement
            </p>
            <p className="mt-0.5 text-xs text-blue-800/80">
              Dédouanement ou livraison en attente de finalisation.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 pl-9"
              placeholder="Rechercher par réf., client, BL…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Rechercher un dossier"
            />
          </div>

          <Select
            value={clientFilter}
            onValueChange={(v) => {
              setClientFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-10 w-full sm:w-52"
              aria-label="Filtrer par client"
            >
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statutFilter}
            onValueChange={(v) => {
              setStatutFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-10 w-full sm:w-44"
              aria-label="Filtrer par statut"
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUT_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "Tous" ? "Tous les statuts" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={periode}
            onValueChange={(v) => {
              setPeriode(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-10 w-full sm:w-44"
              aria-label="Filtrer par période"
            >
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes périodes</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">3 derniers mois</SelectItem>
            </SelectContent>
          </Select>

          {availableYears.length > 1 && (
            <Select
              value={yearFilter}
              onValueChange={(v) => {
                setYearFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-32" aria-label="Filtrer par année">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes années</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v as SortKey);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Trier par">
              <ArrowUpDown className="size-3.5 shrink-0 text-slate-400" />
              <SelectValue placeholder="Trier par…" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 gap-1.5 text-slate-500"
              onClick={clearFilters}
            >
              Réinitialiser
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                {activeFiltersCount}
              </span>
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 shrink-0"
              onClick={handleExportPDF}
              disabled={filtered.length === 0}
              aria-label="Exporter en PDF"
            >
              <FileText className="size-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 shrink-0"
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              aria-label="Exporter en Excel"
            >
              <FileSpreadsheet className="size-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <FolderKanban className="size-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">
            Liste des dossiers
          </h2>
          <span className="ml-auto text-xs tabular-nums text-slate-500">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderKanban className="size-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Aucun dossier trouvé
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau dossier."
                : "Commencez par enregistrer votre premier dossier de transit."}
            </p>
            {!hasActiveFilters && (
              <Button
                className="mt-5"
                onClick={() => openDossier(null, "create")}
              >
                <Plus className="size-4" />
                Nouveau dossier
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Référence
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Client
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                      N° BL
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">
                      Camion
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 xl:table-cell">
                      Nature
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                      Prestation
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Écart
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Statut
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((d) => {
                    const enCours = d.statut === "En cours";
                    const nextTrans = getNextTransition(d.statut);
                    return (
                      <TableRow
                        key={d.id}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "cursor-pointer border-b border-border transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                          enCours && "bg-blue-50/30",
                        )}
                        onClick={() => openDossierDetail(d.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDossierDetail(d.id);
                          }
                        }}
                      >
                        <TableCell className="px-4 py-3.5">
                          <p className="font-medium text-slate-900">
                            {d.reference}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[180px] px-4 py-3.5">
                          <p className="truncate font-medium text-slate-700">
                            {d.clientNom}
                          </p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 tabular-nums text-sm text-slate-600 sm:table-cell">
                          {formatDateShort(d.date)}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 md:table-cell">
                          {d.bl}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 lg:table-cell">
                          {d.camion}
                        </TableCell>
                        <TableCell className="hidden max-w-[160px] px-4 py-3.5 xl:table-cell">
                          <span className="line-clamp-1 text-slate-600">
                            {d.nature}
                          </span>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 md:table-cell">
                          {formatFCFA(d.fraisPrestation)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums">
                          <EcartValue value={calculerEcart(d)} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <DossierStatutBadge statut={d.statut} />
                            {nextTrans && (
                              <button
                                className={cn(
                                  "inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
                                  TRANSITION_META[nextTrans].bgClass,
                                  TRANSITION_META[nextTrans].colorClass,
                                  "hover:opacity-80",
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTransitionDossier(d);
                                }}
                              >
                                {TRANSITION_META[nextTrans].actionLabel}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 hover:text-primary"
                              aria-label={`Voir ${d.reference}`}
                              title="Voir la fiche"
                              onClick={() => openDossierDetail(d.id)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 hover:text-primary"
                              aria-label={`Modifier ${d.reference}`}
                              title="Modifier"
                              onClick={() => openDossier(d.id, "edit")}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </div>
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
              itemLabel={`dossier${filtered.length !== 1 ? "s" : ""}`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* Quick-action transition dialog */}
      {transitionDossier && (() => {
        const nextTrans = getNextTransition(transitionDossier.statut);
        return nextTrans ? (
          <TransitionDialog
            dossier={transitionDossier}
            transition={nextTrans}
            open={!!transitionDossier}
            onOpenChange={(v) => {
              if (!v) setTransitionDossier(null);
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
