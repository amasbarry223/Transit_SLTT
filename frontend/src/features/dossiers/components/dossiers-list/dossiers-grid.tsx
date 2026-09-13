"use client";

import { useCallback, useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useAppNavigation } from "@/lib/app-navigation";
import { useStore } from "@/lib/store";
import type { Dossier } from "@/lib/domain-types";
import { resteAPayer } from "@/lib/domain-types";
import { EmptyState } from "@/components/sltt/empty-state";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { UI } from "@/shared/utils/ui-messages";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { Button } from "@/shared/components/ui/button";
import { TablePagination } from "@/components/sltt/table-pagination";
import {
  TransitionDialog,
  getNextTransition,
} from "@/components/sltt/dossier-transition-dialog";
import { DossierCard } from "./dossier-card";

type DossiersGridProps = {
  filtered: Dossier[];
  paged: Dossier[];
  startIdx: number;
  endIdx: number;
  safePage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  canWrite: boolean;
  canTransition: boolean;
  countsByDossier: Map<string, number>;
  transitionDossier: Dossier | null;
  onPageChange: (page: number) => void;
  onTransitionDossierChange: (dossier: Dossier | null) => void;
};

export function DossiersGrid({
  filtered,
  paged,
  startIdx,
  endIdx,
  safePage,
  totalPages,
  hasActiveFilters,
  canWrite,
  canTransition,
  countsByDossier,
  transitionDossier,
  onPageChange,
  onTransitionDossierChange,
}: DossiersGridProps) {
  const { openDossier } = useNav();
  const currentId = useNav((s) => s.selectedId);
  const { goToDossier, goToEditDossier } = useAppNavigation();
  const removeDossier = useStore((s) => s.removeDossier);
  const { toast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState<Dossier | null>(null);

  // Un clic sur la carte ouvre le dossier (URL synchronisée -> le rafraîchissement
  // ne perd pas le dossier ouvert).
  const handleOpen = useCallback((id: string) => goToDossier(id), [goToDossier]);
  const handleEdit = useCallback((id: string) => goToEditDossier(id), [goToEditDossier]);
  const handleTransition = useCallback(
    (dossier: Dossier) => onTransitionDossierChange(dossier),
    [onTransitionDossierChange],
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeDossier(deleteTarget.id);
      toastSuccess(toast, {
        title: "Dossier supprimé",
        description: deleteTarget.reference,
      });
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible de supprimer le dossier",
        fallback: UI.errors.generic,
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  const deleteConsequences = deleteTarget
    ? [
        countsByDossier.get(deleteTarget.id)
          ? `${countsByDossier.get(deleteTarget.id)} pièce(s) rattachée(s) — les factures et devis seront détachés (non supprimés)`
          : "",
        deleteTarget.montantPaye > 0
          ? `Règlement déjà encaissé : ${deleteTarget.montantPaye.toLocaleString("fr-FR")} FCFA`
          : "",
        resteAPayer(deleteTarget) > 0
          ? `Reste dû non recouvré : ${resteAPayer(deleteTarget).toLocaleString("fr-FR")} FCFA`
          : "",
      ].filter(Boolean)
    : [];

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={hasActiveFilters ? UI.empty.dossiers.filtered.title : UI.empty.dossiers.zero.title}
        description={
          hasActiveFilters
            ? UI.empty.dossiers.filtered.description
            : UI.empty.dossiers.zero.description
        }
        action={
          !hasActiveFilters && canWrite ? (
            <Button onClick={() => openDossier(null, "create")}>
              <Plus className="size-4" />
              {UI.empty.dossiers.zero.action}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {paged.map((dossier) => (
          <DossierCard
            key={dossier.id}
            dossier={dossier}
            itemCount={countsByDossier.get(dossier.id) ?? 0}
            current={currentId === dossier.id}
            canWrite={canWrite}
            canTransition={canTransition}
            onOpen={handleOpen}
            onEdit={handleEdit}
            onTransition={handleTransition}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      <TablePagination
        startIdx={startIdx}
        endIdx={endIdx}
        totalItems={filtered.length}
        itemLabel={`dossier${filtered.length !== 1 ? "s" : ""}`}
        page={safePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Supprimer le dossier ${deleteTarget?.reference ?? ""} ?`}
        description="Cette action est définitive. Le dossier de transit et son suivi douanier seront retirés."
        consequences={deleteConsequences}
        onConfirm={confirmDelete}
      />

      {transitionDossier && (() => {
        const nextTrans = getNextTransition(transitionDossier.statut);
        return nextTrans ? (
          <TransitionDialog
            dossier={transitionDossier}
            transition={nextTrans}
            open={!!transitionDossier}
            onOpenChange={(v) => {
              if (!v) onTransitionDossierChange(null);
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
