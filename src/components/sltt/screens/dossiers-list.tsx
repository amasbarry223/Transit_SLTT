"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  FileText,
  FileSpreadsheet,
  Pencil,
  FolderKanban,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { calculerEcart, resteAPayer, type DossierStatut } from "@/lib/domain-types";
import { formatFCFA, formatDateShort, parseLocalDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search-filter";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { exportToExcel, printHTML, htmlEscape } from "@/lib/export";
import { resolvePrintHTMLBrand } from "@/lib/societe-brand";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { DossierStatutBadge, EcartValue } from "@/components/sltt/status-badge";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { StatusQuickAction } from "@/components/sltt/status-quick-action";
import {
  TransitionDialog,
  getNextTransition,
  TRANSITION_META,
} from "@/components/sltt/dossier-transition-dialog";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { Dossier } from "@/lib/domain-types";
import { TablePagination } from "@/components/sltt/table-pagination";
import { ListFilters } from "@/components/sltt/list-filters";

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
  { value: "montant-desc", label: "Prestation (décroissante)" },
  { value: "montant-asc", label: "Prestation (croissante)" },
  { value: "statut", label: "Statut" },
  { value: "ecart-desc", label: "Marge (décroissante)" },
];



export function DossiersListScreen() {
  const { openDossier, openDossierDetail } = useNav();
  const { toast } = useToast();
  const canWrite = usePermission("dossiers:write");
  const canTransition = usePermission("dossiers:transition");
  const dossiers = useStore((s) => s.dossiers);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("Tous");
  const [nonSoldeOnly, setNonSoldeOnly] = useState(false);
  const [periode, setPeriode] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);

  // Ancrage temporel sur aujourd'hui (cohérent avec le dashboard, cf. getDashboardAnchorDate) —
  // pas sur la date du dossier le plus récent, sinon "dernier mois" dérive dès qu'aucun
  // nouveau dossier n'a été créé récemment.
  const refDate = getDashboardAnchorDate();

  const availableYears = useMemo(() => {
    const years = new Set(dossiers.map((d) => d.date.slice(0, 4)).filter(Boolean));
    return [...years].sort().reverse();
  }, [dossiers]);

  // Quick-action transition dialog
  const [transitionDossier, setTransitionDossier] = useState<Dossier | null>(null);

  const filtered = useMemo(() => {
    const list = dossiers.filter((d) => {
      if (!matchesQuery(d, ["reference", "clientNom", "bl", "camion", "nature"], search)) return false;
      if (clientFilter !== "all" && d.clientId !== clientFilter) return false;
      if (statutFilter !== "Tous" && d.statut !== statutFilter) return false;
      // Exclut seulement les dossiers réellement soldés à solde nul — un dossier
      // "En cours" à montant nul (reste = 0 avant tout chiffrage) doit rester visible.
      if (nonSoldeOnly && resteAPayer(d) <= 0 && d.statut === "Soldé") return false;
      if (yearFilter !== "all" && d.date.slice(0, 4) !== yearFilter) return false;
      if (periode !== "all") {
        const dDate = parseLocalDate(d.date);
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
        // Trie sur fraisPrestation, la seule colonne montant visible dans ce tableau
        // (montantInvesti n'y est pas affiché) — voir libellé "Prestation" ci-dessus.
        case "montant-desc": return b.fraisPrestation - a.fraisPrestation;
        case "montant-asc":  return a.fraisPrestation - b.fraisPrestation;
        case "statut":      return a.statut.localeCompare(b.statut);
        case "ecart-desc":  return calculerEcart(b) - calculerEcart(a);
        default: return 0;
      }
    });
  }, [dossiers, search, clientFilter, statutFilter, nonSoldeOnly, periode, yearFilter, sortBy, refDate]);

  // Les KPI reflètent les filtres actifs (comme le tableau juste en dessous),
  // pas l'ensemble des dossiers — sinon les chiffres semblent contredire ce
  // qui est affiché à l'écran dès qu'un filtre est appliqué.
  const stats = useMemo(() => {
    let enCours = 0;
    let soldes = 0;
    let ecartTotal = 0;
    for (const d of filtered) {
      if (d.statut === "En cours") enCours++;
      if (d.statut === "Soldé") soldes++;
      ecartTotal += calculerEcart(d);
    }
    return { total: filtered.length, enCours, soldes, ecartTotal };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const activeFiltersCount = [
    search.trim() !== "",
    clientFilter !== "all",
    statutFilter !== "Tous",
    nonSoldeOnly,
    periode !== "all",
    yearFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  function clearFilters() {
    setSearch("");
    setClientFilter("all");
    setStatutFilter("Tous");
    setNonSoldeOnly(false);
    setPeriode("all");
    setYearFilter("all");
    setSortBy("date-desc");
    setPage(1);
  }

  async function handleExportExcel() {
    if (filtered.length === 0) {
      toast({
        title: "Rien à exporter",
        description: "Aucun dossier ne correspond aux filtres actuels.",
        variant: "destructive",
      });
      return;
    }
    try {
      await exportToExcel(
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
            accessor: (d) => resteAPayer(d),
          },
          { header: "Marge (FCFA)", accessor: (d) => calculerEcart(d) },
          { header: "Statut", accessor: (d) => d.statut },
          { header: "Date", accessor: (d) => formatDateShort(d.date) },
        ],
        filtered,
        { module: "Dossiers" },
      );
    } catch {
      return;
    }
    toast({
      title: "Export Excel généré",
      description: `${filtered.length} dossiers exportés.`,
    });
  }

  function handleExportPDF() {
    const rowsHTML = filtered
      .map(
        (d) => `<tr>
          <td>${htmlEscape(d.reference)}</td>
          <td>${htmlEscape(d.clientNom)}</td>
          <td>${htmlEscape(d.bl)}</td>
          <td>${htmlEscape(d.camion)}</td>
          <td>${htmlEscape(d.nature)}</td>
          <td class="num">${formatFCFA(d.fraisPrestation, false)}</td>
          <td class="num">${calculerEcart(d).toLocaleString("fr-FR")}</td>
          <td><span class="badge" style="background:#dbeafe;color:#1e3a8a">${htmlEscape(d.statut)}</span></td>
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
          <th>Nature</th><th class="num">Prestation</th><th class="num">Marge</th><th>Statut</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    `,
      resolvePrintHTMLBrand(societes),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers de transit"
        description="Suivi des dossiers douaniers et de leur soldage"
      >
        {canWrite && (
          <Button onClick={() => openDossier(null, "create")}>
            <Plus className="size-4" />
            Nouveau dossier
          </Button>
        )}
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
          label="Marge cumulée"
          value={formatFCFA(stats.ecartTotal)}
          icon={TrendingUp}
          tone="indigo"
          sublabel="marge dossier (prestation − frais)"
          tooltip="Frais de prestation moins droits de douane et frais de circuit."
        />
      </div>

      {/* Filters */}
      <ListFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Rechercher par réf., client, BL…"
        chips={[
          {
            id: "en-cours",
            label: "En cours",
            active: statutFilter === "En cours",
            onToggle: () => {
              setStatutFilter((s) => (s === "En cours" ? "Tous" : "En cours"));
              setPage(1);
            },
          },
          {
            id: "non-solde",
            label: "Non soldé",
            active: nonSoldeOnly,
            onToggle: () => {
              setNonSoldeOnly((v) => !v);
              setPage(1);
            },
          },
          {
            id: "ce-mois",
            label: "Ce mois",
            active: periode === "month",
            onToggle: () => {
              setPeriode((p) => (p === "month" ? "all" : "month"));
              setPage(1);
            },
          },
        ]}
        activeCount={activeFiltersCount}
        onClear={hasActiveFilters ? clearFilters : undefined}
        advanced={
          <>
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
              <ArrowUpDown className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <SelectValue placeholder="Trier par…" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          </>
        }
        actions={
          <>
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
          </>
        }
      />

      {/* Table */}
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <FolderKanban className="size-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Liste des dossiers
          </h2>
          <span className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <FolderKanban className="size-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Aucun dossier trouvé
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau dossier."
                : "Commencez par enregistrer votre premier dossier de transit."}
            </p>
            {!hasActiveFilters && canWrite && (
              <Button
                className="mt-5"
                onClick={() => openDossier(null, "create")}
              >
                <Plus className="size-4" />
                Créer votre premier dossier
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((d) => (
                <Card
                  key={d.id}
                  className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
                  onClick={() => openDossierDetail(d.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{d.reference}</p>
                      <p className="truncate text-sm text-slate-600 dark:text-slate-300">{d.clientNom}</p>
                    </div>
                    <DossierStatutBadge statut={d.statut} />
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Date</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(d.date)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">
                        <GlossaryLabel term="margeDossier" short className="text-xs" />
                      </dt>
                      <dd><EcartValue value={calculerEcart(d)} /></dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Référence
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Client
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      N° BL
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">
                      Camion
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 xl:table-cell">
                      Nature
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Prestation
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <GlossaryLabel term="margeDossier" short className="justify-end" />
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
                  {paged.map((d) => {
                    const enCours = d.statut === "En cours";
                    const nextTrans = getNextTransition(d.statut);
                    return (
                      <TableRow
                        key={d.id}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "cursor-pointer border-b border-border transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                          enCours && "bg-blue-50/30 dark:bg-blue-950/20",
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
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {d.reference}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[180px] px-4 py-3.5">
                          <p className="truncate font-medium text-slate-700 dark:text-slate-300">
                            {d.clientNom}
                          </p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 tabular-nums text-sm text-slate-600 dark:text-slate-300 sm:table-cell">
                          {formatDateShort(d.date)}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 md:table-cell">
                          {d.bl}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 lg:table-cell">
                          {d.camion}
                        </TableCell>
                        <TableCell className="hidden max-w-[160px] px-4 py-3.5 xl:table-cell">
                          <span className="line-clamp-1 text-slate-600 dark:text-slate-300">
                            {d.nature}
                          </span>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 md:table-cell">
                          {formatFCFA(d.fraisPrestation)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums">
                          <EcartValue value={calculerEcart(d)} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <DossierStatutBadge statut={d.statut} />
                            {nextTrans && canTransition && (
                              <StatusQuickAction
                                label={TRANSITION_META[nextTrans].actionLabel}
                                bgClass={TRANSITION_META[nextTrans].bgClass}
                                colorClass={TRANSITION_META[nextTrans].colorClass}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTransitionDossier(d);
                                }}
                              />
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
                              className="size-8 text-slate-500 dark:text-slate-400 hover:text-primary"
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
