"use client";

import { EmptyState } from "@/components/sltt/empty-state";
import { ListFilters } from "@/components/sltt/list-filters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClotureDialog } from "./cloture-dialog";
import { EntitesConsolideesCard } from "./entites-consolidees-card";
import { ImportAnyDialog } from "./import-any-dialog";
import { OperationFormDialog } from "./operation-form-dialog";
import { OperationsKpiRow } from "./operations-kpi-row";
import { OperationsTable } from "./operations-table";
import type { useComptabiliteGeneraleScreen } from "./use-comptabilite-generale-screen";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PiggyBank } from "lucide-react";

interface JournalCaissePanelProps {
  screen: ReturnType<typeof useComptabiliteGeneraleScreen>;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
}

export function JournalCaissePanel({ screen, importOpen, setImportOpen }: JournalCaissePanelProps) {
  if (!screen.resolvedEntite) {
    return (
      <div className="mt-0">
        <EmptyState
          icon={PiggyBank}
          title="Aucune entité comptable disponible"
          description="Aucune annexe ni société « Top Doumani » n'est configurée pour cet utilisateur."
        />
      </div>
    );
  }

  return (
    <div className="mt-0 space-y-6">
      <EntitesConsolideesCard entiteTotals={screen.entiteTotals} activeEntiteKey={screen.resolvedTab} />

      <Tabs value={screen.resolvedTab} onValueChange={screen.setActiveEntiteKey}>
        <TabsList className="h-10 flex-wrap">
          {screen.entites.map((entite) => (
            <TabsTrigger key={`${entite.type}:${entite.id}`} value={`${entite.type}:${entite.id}`}>
              {entite.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <OperationsKpiRow
        totalEntree={screen.totals.totalEntree}
        totalSortie={screen.totals.totalSortie}
        soldeTheorique={screen.totals.soldeTheorique}
      />

      {screen.dernieresClotures.length > 0 && (
        <Card className="border-border/80 p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dernières clôtures
          </p>
          <div className="flex flex-wrap gap-2">
            {screen.dernieresClotures.slice(0, 6).map((c) => (
              <Badge
                key={c.id}
                variant="outline"
                className={cn(
                  "font-normal",
                  c.ecart === 0
                    ? "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400"
                    : "border-red-200 text-red-700 dark:border-red-900 dark:text-red-400",
                )}
              >
                {formatDateShort(c.periodeDebut)} → {formatDateShort(c.periodeFin)} · écart {formatFCFA(c.ecart)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <ListFilters
        search={screen.query}
        onSearchChange={(v) => {
          screen.setQuery(v);
          screen.setPage(1);
        }}
        searchPlaceholder="Rechercher (client, nature, référence)…"
        chips={[
          {
            id: "dossiers",
            label: "Dossiers transit",
            active: screen.scopeFilter === "dossiers",
            onToggle: () => {
              screen.setScopeFilter(screen.scopeFilter === "dossiers" ? "tous" : "dossiers");
              screen.setPage(1);
            },
          },
          {
            id: "generales",
            label: "Frais généraux",
            active: screen.scopeFilter === "generales",
            onToggle: () => {
              screen.setScopeFilter(screen.scopeFilter === "generales" ? "tous" : "generales");
              screen.setPage(1);
            },
          },
          {
            id: "entree",
            label: "Entrée",
            active: screen.typeFilter === "Entrée",
            onToggle: () => {
              screen.setTypeFilter(screen.typeFilter === "Entrée" ? "all" : "Entrée");
              screen.setPage(1);
            },
          },
          {
            id: "sortie",
            label: "Sortie",
            active: screen.typeFilter === "Sortie",
            onToggle: () => {
              screen.setTypeFilter(screen.typeFilter === "Sortie" ? "all" : "Sortie");
              screen.setPage(1);
            },
          },
        ]}
        activeCount={screen.activeFilterCount}
        onClear={screen.clearFilters}
        advanced={
          <>
            <Select
              value={screen.clientFilter || "all"}
              onValueChange={(v) => {
                screen.setClientFilter(v === "all" ? "" : v);
                screen.setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-48">
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {screen.clientOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={screen.dateFrom}
                onChange={(e) => {
                  screen.setDateFrom(e.target.value);
                  screen.setPage(1);
                }}
                className="h-10 w-40"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <Input
                type="date"
                value={screen.dateTo}
                onChange={(e) => {
                  screen.setDateTo(e.target.value);
                  screen.setPage(1);
                }}
                className="h-10 w-40"
              />
            </div>
          </>
        }
      />

      <OperationsTable
        operations={screen.paged}
        ecartCumuleById={screen.ecartCumuleById}
        ecartClientCumuleById={screen.ecartClientCumuleById}
        totalItems={screen.totalItems}
        hasActiveFilters={screen.hasActiveFilters}
        canWrite={screen.canWrite}
        showQuantitePrixUnitaire={screen.resolvedEntite.type === "societe"}
        startIdx={screen.startIdx}
        endIdx={screen.endIdx}
        page={screen.page}
        totalPages={screen.totalPages}
        onPageChange={screen.setPage}
        onDelete={screen.setDeleteTarget}
        onCreate={() => screen.setFormOpen(true)}
      />

      <ConfirmDeleteDialog
        open={!!screen.deleteTarget}
        onOpenChange={(open) => !open && screen.setDeleteTarget(null)}
        title="Supprimer cette opération ?"
        description={
          <>
            L&apos;opération <strong>{screen.deleteTarget?.reference}</strong> ({screen.deleteTarget?.clientNom} ·{" "}
            {screen.deleteTarget?.type} · {formatFCFA(screen.deleteTarget?.montant ?? 0)}) sera définitivement
            supprimée. Cette action est irréversible.
          </>
        }
        onConfirm={screen.confirmDelete}
      />

      <OperationFormDialog open={screen.formOpen} onOpenChange={screen.setFormOpen} entite={screen.resolvedEntite} />
      <ImportAnyDialog open={importOpen} onOpenChange={setImportOpen} entite={screen.resolvedEntite} entites={screen.entites} />
      <ClotureDialog
        open={screen.clotureOpen}
        onOpenChange={screen.setClotureOpen}
        entite={screen.resolvedEntite}
        dernieresClotures={screen.dernieresClotures}
      />
    </div>
  );
}
