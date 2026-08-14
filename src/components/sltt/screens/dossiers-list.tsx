"use client";

import {
  Plus,
  FileText,
  FileSpreadsheet,
  FolderKanban,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { formatFCFA } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { usePermission } from "@/hooks/use-permission";
import { CreateDossierFromOcrButton } from "@/components/sltt/documents/create-dossier-from-ocr";
import { DossierBulkImportButton } from "@/components/sltt/documents/dossier-bulk-import-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilters } from "@/components/sltt/list-filters";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import {
  DossiersListTable,
  useDossiersListScreen,
  STATUT_OPTIONS,
  SORT_OPTIONS,
  type SortKey,
} from "@/components/sltt/dossiers-list";

export function DossiersListScreen() {
  const { openDossier } = useNav();
  const canWrite = usePermission("dossiers:write");
  const canTransition = usePermission("dossiers:transition");
  const screen = useDossiersListScreen();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers de transit"
        description="Suivi des dossiers douaniers et de leur soldage"
      >
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <DossierBulkImportButton />
            <CreateDossierFromOcrButton />
            <Button onClick={() => openDossier(null, "create")}>
              <Plus className="size-4" />
              Nouveau dossier
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total dossiers"
          value={String(screen.stats.total)}
          icon={FolderKanban}
          tone="blue"
          sublabel="dossiers enregistrés"
        />
        <KpiCard
          label="En cours"
          value={String(screen.stats.enCours)}
          icon={Clock}
          tone="amber"
          sublabel="en traitement douanier"
        />
        <KpiCard
          label="Soldés"
          value={String(screen.stats.soldes)}
          icon={CheckCircle2}
          tone="emerald"
          sublabel="dossiers clôturés"
        />
        <KpiCard
          label="Marge cumulée"
          value={formatFCFA(screen.stats.ecartTotal)}
          icon={TrendingUp}
          tone="indigo"
          sublabel="marge dossier (prestation − frais)"
          tooltip="Frais de prestation moins droits de douane et frais de circuit."
        />
      </div>

      <ListFilters
        search={screen.search}
        onSearchChange={(v) => {
          screen.setSearch(v);
          screen.setPage(1);
        }}
        searchPlaceholder="Rechercher par réf., client, BL…"
        chips={[
          {
            id: "en-cours",
            label: "En cours",
            active: screen.statutFilter === "En cours",
            onToggle: () => {
              screen.setStatutFilter((s) => (s === "En cours" ? "Tous" : "En cours"));
              screen.setPage(1);
            },
          },
          {
            id: "non-solde",
            label: "Non soldé",
            active: screen.nonSoldeOnly,
            onToggle: () => {
              screen.setNonSoldeOnly((v) => !v);
              screen.setPage(1);
            },
          },
          {
            id: "ce-mois",
            label: "Ce mois",
            active: screen.periode === "month",
            onToggle: () => {
              screen.setPeriode((p) => (p === "month" ? "all" : "month"));
              screen.setPage(1);
            },
          },
        ]}
        activeCount={screen.activeFiltersCount}
        onClear={screen.hasActiveFilters ? screen.clearFilters : undefined}
        advanced={
          <>
            <SocieteFilterSelect className="w-full sm:w-44" />
            <Select
              value={screen.clientFilter}
              onValueChange={(v) => {
                screen.setClientFilter(v);
                screen.setPage(1);
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
                {screen.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={screen.statutFilter}
              onValueChange={(v) => {
                screen.setStatutFilter(v);
                screen.setPage(1);
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
              value={screen.periode}
              onValueChange={(v) => {
                screen.setPeriode(v);
                screen.setPage(1);
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

            {screen.availableYears.length > 1 && (
              <Select
                value={screen.yearFilter}
                onValueChange={(v) => {
                  screen.setYearFilter(v);
                  screen.setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-32" aria-label="Filtrer par année">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes années</SelectItem>
                  {screen.availableYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={screen.sortBy}
              onValueChange={(v) => {
                screen.setSortBy(v as SortKey);
                screen.setPage(1);
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
              onClick={screen.handleExportPDF}
              disabled={screen.filtered.length === 0}
              aria-label="Exporter en PDF"
            >
              <FileText className="size-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 shrink-0"
              onClick={screen.handleExportExcel}
              disabled={screen.filtered.length === 0}
              title="Exporter en Excel"
              aria-label="Exporter en Excel"
            >
              <FileSpreadsheet className="size-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </>
        }
      />

      <DossiersListTable
        filtered={screen.filtered}
        paged={screen.paged}
        startIdx={screen.startIdx}
        endIdx={screen.endIdx}
        safePage={screen.safePage}
        totalPages={screen.totalPages}
        hasActiveFilters={screen.hasActiveFilters}
        canWrite={canWrite}
        canTransition={canTransition}
        transitionDossier={screen.transitionDossier}
        onPageChange={screen.setPage}
        onTransitionDossierChange={screen.setTransitionDossier}
      />
    </div>
  );
}
