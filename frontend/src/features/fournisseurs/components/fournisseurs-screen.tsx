"use client";

import {
  Plus,
  Building2,
  TrendingDown,
  TrendingUp,
  Layers,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent } from "@/shared/components/ui/tabs";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ListFilters } from "@/components/sltt/list-filters";
import { MetaTabsList } from "@/components/sltt/meta-tabs-list";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { formatFCFA } from "@/lib/format";
import {
  FournisseurFormModal,
  PrestatairesTable,
  TarifsTable,
  CoutsTable,
  useFournisseursScreen,
  TAB_META,
  type FournisseurTab,
} from "./fournisseurs";

export function FournisseursScreen() {
  const screen = useFournisseursScreen();

  const emptyCta = screen.canWrite ? (
    <Button
      onClick={screen.openCreateForm}
      className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all"
    >
      <Plus className="size-4" />
      Nouveau fournisseur
    </Button>
  ) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Fournisseurs" description={screen.currentMeta.description}>
        {screen.canWrite && (
          <Button
            onClick={screen.openCreateForm}
            className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all"
          >
            <Plus className="size-4" />
            Nouveau fournisseur
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Fournisseurs actifs"
          value={String(screen.actifs)}
          icon={Building2}
          tone="blue"
          sublabel={`sur ${screen.counts.prestataires} au total`}
        />
        <KpiCard
          label="Types couverts"
          value={String(screen.nbTypes)}
          icon={Layers}
          tone="indigo"
          sublabel="catégories de prestation"
        />
        <KpiCard
          label="Avec tarif défini"
          value={String(screen.avecTarif)}
          icon={TrendingUp}
          tone="amber"
          sublabel="tarif contractuel renseigné"
        />
        <KpiCard
          label="Total sous-traité"
          value={formatFCFA(screen.totalMontant)}
          icon={TrendingDown}
          tone="red"
          sublabel="montant réel sur dossiers"
        />
      </div>

      <Tabs
        value={screen.activeTab}
        onValueChange={(v) => screen.setActiveTab(v as FournisseurTab)}
        className="space-y-4"
      >
        <MetaTabsList items={TAB_META} counts={screen.counts} gridClassName="grid-cols-1 sm:grid-cols-3" />

        <ListFilters
          search={screen.search}
          onSearchChange={screen.setSearch}
          searchPlaceholder={
            screen.activeTab === "couts"
              ? "Rechercher une liaison, un dossier…"
              : "Rechercher un prestataire…"
          }
          chips={screen.chips}
          activeCount={screen.typeFilter ? 1 : 0}
          onClear={screen.clearTypeFilter}
          actions={
            screen.activeTab === "prestataires" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0"
                  onClick={screen.handleExportPDF}
                  disabled={screen.filtered.length === 0}
                  aria-label="Imprimer / exporter en PDF"
                  title="Imprimer / PDF"
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
                  aria-label="Exporter en Excel"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="size-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </>
            ) : undefined
          }
        />

        <TabsContent value="prestataires" className="mt-0 space-y-4">
          <PrestatairesTable
            items={screen.prestatairesPagination.paged}
            canWrite={screen.canWrite}
            onEdit={screen.handleEdit}
            onDelete={screen.handleDeleteRequest}
            emptyAction={emptyCta}
            pagination={{
              startIdx: screen.prestatairesPagination.startIdx,
              endIdx: screen.prestatairesPagination.endIdx,
              totalItems: screen.filtered.length,
              page: screen.prestatairesPagination.safePage,
              totalPages: screen.prestatairesPagination.totalPages,
              onPageChange: screen.setPrestatairesPage,
            }}
          />
        </TabsContent>

        <TabsContent value="tarifs" className="mt-0 space-y-4">
          <TarifsTable
            items={screen.tarifsPagination.paged}
            canWrite={screen.canWrite}
            onEdit={screen.handleEdit}
            emptyAction={emptyCta}
            pagination={{
              startIdx: screen.tarifsPagination.startIdx,
              endIdx: screen.tarifsPagination.endIdx,
              totalItems: screen.tarifsSorted.length,
              page: screen.tarifsPagination.safePage,
              totalPages: screen.tarifsPagination.totalPages,
              onPageChange: screen.setTarifsPage,
            }}
          />
        </TabsContent>

        <TabsContent value="couts" className="mt-0 space-y-4">
          <CoutsTable
            items={screen.coutsPagination.paged}
            onOpenDossier={screen.openDossier}
            pagination={{
              startIdx: screen.coutsPagination.startIdx,
              endIdx: screen.coutsPagination.endIdx,
              totalItems: screen.liaisonsEnrichies.length,
              page: screen.coutsPagination.safePage,
              totalPages: screen.coutsPagination.totalPages,
              onPageChange: screen.setCoutsPage,
            }}
          />
        </TabsContent>
      </Tabs>

      <FournisseurFormModal
        open={screen.showForm}
        onClose={screen.closeForm}
        editing={screen.editing}
      />

      <ConfirmDeleteDialog
        open={!!screen.deleteTarget}
        onOpenChange={(v) => {
          if (!v) screen.setDeleteTarget(null);
        }}
        title="Supprimer ce fournisseur ?"
        description={
          <>
            <strong>{screen.deleteTarget?.nom}</strong> sera
            définitivement supprimé, ainsi que toutes ses liaisons budget/réel sur les dossiers
            associés (historique perdu).
          </>
        }
        onConfirm={screen.handleDelete}
      />
    </div>
  );
}
