"use client";

import {
  Plus,
  FileText,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowUpDown,
  FolderKanban,
  LayoutGrid,
  List,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { formatFCFA } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { usePermission } from "@/shared/hooks/use-permission";
import { DossierBulkImportButton } from "@/components/sltt/documents/dossier-bulk-import-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ListFilters } from "@/components/sltt/list-filters";
import { cn } from "@/shared/utils/cn";
import {
  DossiersListTable,
  DossiersGrid,
  useDossiersListScreen,
  STATUT_OPTIONS,
  SORT_OPTIONS,
  type SortKey,
} from "./dossiers-list";

export function DossiersListScreen() {
  const { openDossier } = useNav();
  const canWrite = usePermission("dossiers:write");
  const canTransition = usePermission("dossiers:transition");
  const screen = useDossiersListScreen();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers de transit"
        description="Cycle devis → dossier → dédouanement → livraison → solde"
      >
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2.5">
            <DossierBulkImportButton />
            <Button
              onClick={() => openDossier(null, "create")}
              className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="size-4 shrink-0 stroke-[3]" />
              <span>Nouveau dossier</span>
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          tone="indigo"
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
          tone="amber"
          sublabel="marge prestation − frais"
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
        ]}
        activeCount={screen.activeFiltersCount}
        onClear={screen.hasActiveFilters ? screen.clearFilters : undefined}
        advanced={
          <>
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
                <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
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
            <div
              className="flex h-10 shrink-0 items-center rounded-lg border border-border/70 bg-muted/40 p-0.5"
              role="group"
              aria-label="Mode d'affichage"
            >
              <button
                type="button"
                onClick={() => screen.setViewMode("grid")}
                aria-pressed={screen.viewMode === "grid"}
                title="Affichage en grille"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors",
                  screen.viewMode === "grid"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => screen.setViewMode("list")}
                aria-pressed={screen.viewMode === "list"}
                title="Affichage en tableau"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors",
                  screen.viewMode === "list"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="size-4" />
              </button>
            </div>
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

      {screen.viewMode === "grid" ? (
        <DossiersGrid
          filtered={screen.filtered}
          paged={screen.paged}
          startIdx={screen.startIdx}
          endIdx={screen.endIdx}
          safePage={screen.safePage}
          totalPages={screen.totalPages}
          hasActiveFilters={screen.hasActiveFilters}
          canWrite={canWrite}
          canTransition={canTransition}
          countsByDossier={screen.countsByDossier}
          transitionDossier={screen.transitionDossier}
          onPageChange={screen.setPage}
          onTransitionDossierChange={screen.setTransitionDossier}
        />
      ) : (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-xs bg-card p-0">
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
        </Card>
      )}
    </div>
  );
}
