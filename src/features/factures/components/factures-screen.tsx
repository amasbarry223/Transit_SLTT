"use client";

import { useCallback } from "react";
import { Plus, Receipt, Search, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { InfoCallout } from "@/components/sltt/info-callout";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
import { formatFCFA } from "@/lib/format";
import type { Facture } from "@/lib/store";
import { FactureFormModal } from "./factures/facture-form-modal";
import { FacturesTable } from "./factures/factures-table";
import { useFacturesScreen } from "./factures/use-factures-screen";
import { FACTURE_TABS } from "./factures/shared";

export function FacturesScreen() {
  const screen = useFacturesScreen();
  const handleView = useCallback((f: Facture) => screen.go("facture-detail", { id: f.id }), [screen.go]);
  const handleMarkEnvoyee = useCallback((f: Facture) => screen.setEnvoyeeTarget(f), [screen.setEnvoyeeTarget]);
  const handleDelete = useCallback((f: Facture) => screen.setDeleteTarget(f), [screen.setDeleteTarget]);

  return (
    <div className="space-y-6 pb-6">
      <FactureFormModal
        key={screen.formKey}
        open={screen.showForm}
        onClose={screen.closeForm}
        prefill={screen.formPrefill}
      />

      <PageHeader
        title="Facturation Client"
        description="Gestion, suivi des créances et encaissements avec TVA"
      >
        {screen.canWrite && (
          <Button
            onClick={() => screen.setShowForm(true)}
            className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="size-4 shrink-0 stroke-[3]" />
            <span>Nouvelle facture</span>
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

      {/* 4 Grandes Cartes KPI Pleines et Colorées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Factures actives"
          value={String(screen.kpi.total)}
          icon={Receipt}
          tone="blue"
          sublabel="émises au total"
        />
        <KpiCard
          label="Montant total TTC"
          value={formatFCFA(screen.kpi.totalTTC)}
          icon={TrendingUp}
          tone="indigo"
          sublabel="chiffre d'affaires facturé"
        />
        <KpiCard
          label="Total recouvré"
          value={formatFCFA(screen.kpi.totalPaye)}
          icon={CheckCircle2}
          tone="emerald"
          sublabel={`${screen.kpi.tauxRecouvrement}% du montant total`}
        />
        <KpiCard
          label="Reste à encaisser"
          value={formatFCFA(screen.kpi.totalTTC - screen.kpi.totalPaye)}
          icon={Clock}
          tone="red"
          sublabel={`${screen.kpi.nonSoldees} facture${screen.kpi.nonSoldees > 1 ? "s" : ""} en attente`}
        />
      </div>

      {/* Taux de recouvrement progress bar */}
      {screen.kpi.total > 0 && (
        <Card className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Taux de recouvrement global</span>
            <span className="font-black tabular-nums text-foreground">{screen.kpi.tauxRecouvrement}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${screen.kpi.tauxRecouvrement}%` }}
            />
          </div>
        </Card>
      )}

      {/* Filtres + recherche */}
      <Card className="rounded-2xl border border-border/70 p-4 shadow-xs bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {FACTURE_TABS.map((tab) => {
              const count = screen.tabCounts.get(tab.key) ?? 0;
              const isActive = screen.activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => screen.changeTab(tab.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#1344C8] text-white shadow-sm"
                      : "bg-[#F1F5F9] dark:bg-muted/40 text-muted-foreground hover:bg-slate-200/70 dark:hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-white dark:bg-muted text-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher une facture…"
              value={screen.search}
              onChange={(e) => screen.changeSearch(e.target.value)}
              className="h-10 pl-10 rounded-xl border border-slate-200/80 bg-[#F1F5F9] dark:bg-muted/40 text-xs sm:text-sm text-foreground focus-visible:ring-primary/40 shadow-none"
            />
          </div>
        </div>
      </Card>

      {/* Tableau des factures */}
      <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-xs bg-card p-0">
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
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(screen.deleteTarget)}
        onOpenChange={(v) => !v && screen.setDeleteTarget(null)}
        title="Supprimer cette facture ?"
        description={<>La facture <strong>{screen.deleteTarget?.numero}</strong> sera définitivement supprimée. Cette action est irréversible.</>}
        consequences={
          screen.deleteTarget && screen.deleteTarget.montantPaye > 0
            ? [`Le paiement déjà encaissé (${formatFCFA(screen.deleteTarget.montantPaye)}) disparaîtra avec la facture.`]
            : undefined
        }
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
