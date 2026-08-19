"use client";

import { useCallback } from "react";
import { Plus, Receipt, Search, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { InfoCallout } from "@/components/sltt/info-callout";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import { formatFCFA } from "@/lib/format";
import type { Facture } from "@/lib/store";
import { FactureFormModal } from "./factures/facture-form-modal";
import { FacturesTable } from "./factures/factures-table";
import { useFacturesScreen } from "./factures/use-factures-screen";
import { FACTURE_TABS } from "./factures/shared";

export function FacturesScreen() {
  const screen = useFacturesScreen();
  // Références stables pour que React.memo sur FactureTableRow/FactureMobileCard
  // (voir factures-table.tsx) évite un re-render de chaque ligne à chaque render
  // de l'écran (recherche, changement d'onglet, etc.).
  const handleView = useCallback((f: Facture) => screen.go("facture-detail", { id: f.id }), [screen.go]);
  const handleMarkEnvoyee = useCallback((f: Facture) => screen.setEnvoyeeTarget(f), [screen.setEnvoyeeTarget]);
  const handleDelete = useCallback((f: Facture) => screen.setDeleteTarget(f), [screen.setDeleteTarget]);

  return (
    <div className="space-y-5">
      <FactureFormModal
        key={screen.formKey}
        open={screen.showForm}
        onClose={screen.closeForm}
        prefill={screen.formPrefill}
      />

      <PageHeader title="Factures" description="Gestion et suivi de la facturation client">
        {screen.canWrite && (
          <Button onClick={() => screen.setShowForm(true)}>
            <Plus className="mr-1.5 size-3.5" /> Nouvelle facture
          </Button>
        )}
      </PageHeader>

      <InfoCallout>
        Ce module émet des documents facturables au client (avec TVA). Pour un suivi interne de
        paiement sans facture, utilisez{" "}
        <Button variant="link" className="h-auto p-0 font-semibold" onClick={() => screen.go("comptabilite")}>
          le module Comptabilité
        </Button>
        . Les deux totaux sont indépendants et ne se recoupent pas automatiquement.
      </InfoCallout>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard compact label="Factures actives" value={String(screen.kpi.total)} icon={Receipt} tone="blue" />
        <KpiCard compact label="Montant total TTC" value={formatFCFA(screen.kpi.totalTTC)} icon={TrendingUp} tone="emerald" />
        <KpiCard compact label="Recouvré" value={formatFCFA(screen.kpi.totalPaye)} icon={CheckCircle2} tone="violet" />
        <KpiCard compact label="Non soldées" value={String(screen.kpi.nonSoldees)} icon={Clock} tone="amber" />
      </div>

      {/* Taux de recouvrement bar */}
      {screen.kpi.total > 0 && (
        <div className="rounded-xl border border-border/80 bg-white bg-muted/40 px-5 py-3.5 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground/90">Taux de recouvrement</span>
            <span className="font-bold tabular-nums text-foreground">{screen.kpi.tauxRecouvrement}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${screen.kpi.tauxRecouvrement}%` }}
            />
          </div>
        </div>
      )}

      {/* Filtres + recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {FACTURE_TABS.map((tab) => {
            const count = screen.tabCounts.get(tab.key) ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => screen.changeTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  screen.activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-slate-200"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${screen.activeTab === tab.key ? "bg-white/20 text-white" : "bg-white bg-muted/40 text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <SocieteFilterSelect className="h-8 w-full sm:w-44" />
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={screen.search}
              onChange={(e) => screen.changeSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      </div>

      <FacturesTable
        factures={screen.paged}
        totalItems={screen.filtered.length}
        hasAnyFacture={screen.factures.length > 0}
        canWrite={screen.canWrite}
        startIdx={screen.startIdx}
        endIdx={screen.endIdx}
        page={screen.page}
        totalPages={screen.totalPages}
        onPageChange={screen.setPage}
        onView={handleView}
        onMarkEnvoyee={handleMarkEnvoyee}
        onDelete={handleDelete}
        onCreate={() => screen.setShowForm(true)}
      />

      <ConfirmDeleteDialog
        open={Boolean(screen.deleteTarget)}
        onOpenChange={(v) => !v && screen.setDeleteTarget(null)}
        title="Supprimer cette facture ?"
        description={<>La facture <strong>{screen.deleteTarget?.numero}</strong> sera définitivement supprimée. Cette action est irréversible.</>}
        onConfirm={screen.handleDelete}
      />

      <ConfirmActionDialog
        open={!!screen.envoyeeTarget}
        onOpenChange={(open) => !open && screen.setEnvoyeeTarget(null)}
        title="Marquer cette facture comme envoyée ?"
        description={
          <>
            La facture <strong>{screen.envoyeeTarget?.numero}</strong> ({screen.envoyeeTarget?.clientNom}) passera au statut{" "}
            <strong>Envoyée</strong>.
          </>
        }
        confirmLabel="Marquer comme envoyée"
        onConfirm={screen.handleMarkEnvoyee}
      />
    </div>
  );
}
