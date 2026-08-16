"use client";

import {
  Plus,
  Building2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
    <Button size="sm" onClick={screen.openCreateForm}>
      <Plus className="size-4" />
      Nouveau fournisseur
    </Button>
  ) : undefined;

  return (
    <div className="space-y-5">
      <PageHeader title="Fournisseurs" description={screen.currentMeta.description}>
        {screen.canWrite && (
          <Button size="sm" onClick={screen.openCreateForm}>
            <Plus className="size-4" />
            Nouveau fournisseur
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard compact label="Fournisseurs actifs" value={String(screen.actifs)} icon={Building2} tone="blue" />
        <KpiCard
          compact
          label="Total sous-traité"
          value={formatFCFA(screen.totalMontant)}
          icon={TrendingDown}
          tone="red"
        />
        <KpiCard
          compact
          label="Budget alloué"
          value={formatFCFA(screen.totalBudgete)}
          icon={TrendingUp}
          tone="indigo"
        />
        <KpiCard
          compact
          label={screen.activeTab === "tarifs" ? "Avec tarif défini" : "Paiements en attente"}
          value={screen.activeTab === "tarifs" ? String(screen.avecTarif) : String(screen.enAttente)}
          icon={screen.activeTab === "tarifs" ? Banknote : AlertCircle}
          tone="amber"
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
        />

        <TabsContent value="prestataires" className="mt-0 space-y-4">
          <PrestatairesTable
            items={screen.filtered}
            canWrite={screen.canWrite}
            onEdit={screen.handleEdit}
            onDelete={screen.handleDeleteRequest}
            emptyAction={emptyCta}
          />
        </TabsContent>

        <TabsContent value="tarifs" className="mt-0 space-y-4">
          <TarifsTable
            items={screen.tarifsSorted}
            canWrite={screen.canWrite}
            onEdit={screen.handleEdit}
            emptyAction={emptyCta}
          />
        </TabsContent>

        <TabsContent value="couts" className="mt-0 space-y-4">
          <CoutsTable items={screen.liaisonsEnrichies} onOpenDossier={screen.openDossier} />
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
