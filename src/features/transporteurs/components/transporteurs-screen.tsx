"use client";

import { Plus, Truck, Package, PowerOff } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  TransporteurFormModal,
  TransporteursTable,
  useTransporteursScreen,
} from "@/components/sltt/transporteurs";

export function TransporteursScreen() {
  const screen = useTransporteursScreen();

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Transporteurs" description="Annuaire des transporteurs et chauffeurs partenaires">
        {screen.canWrite && (
          <Button onClick={screen.openAddForm}>
            <Plus className="size-4" /> Nouveau transporteur
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Actifs"
          value={String(screen.kpis.actifs)}
          icon={Truck}
          tone="emerald"
          sublabel="disponibles pour missions"
        />
        <KpiCard
          label="Inactifs"
          value={String(screen.kpis.inactifs)}
          icon={PowerOff}
          tone="amber"
          sublabel="en maintenance ou suspendus"
        />
        <KpiCard
          label="Capacité totale"
          value={`${screen.kpis.capaciteTotal} t`}
          icon={Package}
          tone="indigo"
          sublabel="des transporteurs actifs"
        />
      </div>

      {screen.kpis.inactifs > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3">
          <Truck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {screen.kpis.inactifs} transporteur{screen.kpis.inactifs > 1 ? "s" : ""} inactif
              {screen.kpis.inactifs > 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300/80">
              Ces partenaires ne peuvent pas recevoir de nouvelles missions.
            </p>
          </div>
        </div>
      )}

      <TransporteursTable
        filtered={screen.filtered}
        paged={screen.paged}
        canWrite={screen.canWrite}
        search={screen.search}
        onSearchChange={screen.changeSearch}
        vehiculeFilter={screen.vehiculeFilter}
        onVehiculeFilterChange={screen.changeVehiculeFilter}
        statutFilter={screen.statutFilter}
        onStatutFilterChange={screen.changeStatutFilter}
        sortBy={screen.sortBy}
        onSortByChange={screen.changeSortBy}
        hasActiveFilters={screen.hasActiveFilters}
        activeFiltersCount={screen.activeFiltersCount}
        onClearFilters={screen.clearFilters}
        onExportPDF={screen.handleExportPDF}
        onExportExcel={screen.handleExportExcel}
        onAdd={screen.openAddForm}
        onEdit={screen.openEditForm}
        onDelete={screen.openDelete}
        onToggleStatut={screen.handleToggleStatut}
        startIdx={screen.startIdx}
        endIdx={screen.endIdx}
        page={screen.page}
        totalPages={screen.totalPages}
        onPageChange={screen.setPage}
      />

      {screen.inlineForm && (
        <TransporteurFormModal
          key={screen.inlineForm.target?.id ?? "new"}
          open
          mode={screen.inlineForm.mode}
          target={screen.inlineForm.target}
          onClose={screen.closeForm}
        />
      )}

      <ConfirmDeleteDialog
        open={!!screen.deleteTarget}
        onOpenChange={(v) => { if (!v) screen.setDeleteTarget(null); }}
        title="Supprimer ce transporteur ?"
        description={
          <>
            <strong>{screen.deleteTarget?.nom}</strong>
            {screen.deleteTarget && ` (${screen.deleteTarget.vehicule} · ${screen.deleteTarget.trajet})`} sera
            définitivement retiré de l'annuaire. Les dossiers associés ne seront pas affectés.
          </>
        }
        onConfirm={screen.confirmDeleteTransporteur}
      />

      <ConfirmActionDialog
        open={!!screen.deactivateTarget}
        onOpenChange={(open) => !open && screen.setDeactivateTarget(null)}
        title="Désactiver ce transporteur ?"
        description={
          <>
            <strong>{screen.deactivateTarget?.nom}</strong> ne sera plus proposé dans les sélections de transport tant
            qu&apos;il n&apos;aura pas été réactivé.
          </>
        }
        confirmLabel="Désactiver"
        variant="destructive"
        onConfirm={screen.confirmDeactivate}
      />
    </div>
  );
}
