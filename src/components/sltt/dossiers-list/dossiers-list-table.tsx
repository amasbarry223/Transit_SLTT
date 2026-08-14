"use client";

import { memo, useCallback } from "react";
import { Plus, Pencil, FolderKanban } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { calculerEcart } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { EmptyState } from "@/components/sltt/empty-state";
import { DossierStatutBadge, EcartValue } from "@/components/sltt/status-badge";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { StatusQuickAction } from "@/components/sltt/status-quick-action";
import {
  TransitionDialog,
  getNextTransition,
  TRANSITION_META,
} from "@/components/sltt/dossier-transition-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { SocieteBadge } from "@/components/sltt/societe-filter-select";

type DossiersListTableProps = {
  filtered: Dossier[];
  paged: Dossier[];
  startIdx: number;
  endIdx: number;
  safePage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  canWrite: boolean;
  canTransition: boolean;
  transitionDossier: Dossier | null;
  onPageChange: (page: number) => void;
  onTransitionDossierChange: (dossier: Dossier | null) => void;
};

// Lignes mémoïsées : avec la pagination (8 lignes/page) le gain reste modeste,
// mais évite de re-rendre toutes les lignes affichées quand seul l'état du
// tableau parent (page, filtres) change sans toucher les dossiers eux-mêmes.
const DossierMobileCard = memo(function DossierMobileCard({
  dossier,
  onOpenDetail,
}: {
  dossier: Dossier;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <Card
      className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
      onClick={() => onOpenDetail(dossier.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100">{dossier.reference}</p>
          <p className="truncate text-sm text-slate-600 dark:text-slate-300">{dossier.clientNom}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <SocieteBadge societeNom={dossier.societeNom} size="sm" />
          <DossierStatutBadge statut={dossier.statut} />
        </div>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Date</dt>
          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(dossier.date)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            <GlossaryLabel term="margeDossier" short className="text-xs" />
          </dt>
          <dd><EcartValue value={calculerEcart(dossier)} /></dd>
        </div>
      </dl>
    </Card>
  );
});

const DossierTableRow = memo(function DossierTableRow({
  dossier,
  canTransition,
  onOpenDetail,
  onEdit,
  onTransitionClick,
}: {
  dossier: Dossier;
  canTransition: boolean;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onTransitionClick: (dossier: Dossier) => void;
}) {
  const enCours = dossier.statut === "En cours";
  const nextTrans = getNextTransition(dossier.statut);

  return (
    <TableRow
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-pointer border-b border-border transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        enCours && "bg-blue-50/30 dark:bg-blue-950/20",
      )}
      onClick={() => onOpenDetail(dossier.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail(dossier.id);
        }
      }}
    >
      <TableCell className="px-4 py-3.5">
        <p className="font-medium text-slate-900 dark:text-slate-100">
          {dossier.reference}
        </p>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 md:table-cell">
        <SocieteBadge societeNom={dossier.societeNom} size="sm" />
      </TableCell>
      <TableCell className="max-w-[180px] px-4 py-3.5">
        <p className="truncate font-medium text-slate-700 dark:text-slate-300">
          {dossier.clientNom}
        </p>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 tabular-nums text-sm text-slate-600 dark:text-slate-300 sm:table-cell">
        {formatDateShort(dossier.date)}
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 md:table-cell">
        {dossier.bl}
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 lg:table-cell">
        {dossier.camion}
      </TableCell>
      <TableCell className="hidden max-w-[160px] px-4 py-3.5 xl:table-cell">
        <span className="line-clamp-1 text-slate-600 dark:text-slate-300">
          {dossier.nature}
        </span>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 md:table-cell">
        {formatFCFA(dossier.fraisPrestation)}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right tabular-nums">
        <EcartValue value={calculerEcart(dossier)} />
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <DossierStatutBadge statut={dossier.statut} />
          {nextTrans && canTransition && (
            <StatusQuickAction
              label={TRANSITION_META[nextTrans].actionLabel}
              bgClass={TRANSITION_META[nextTrans].bgClass}
              colorClass={TRANSITION_META[nextTrans].colorClass}
              onClick={(e) => {
                e.stopPropagation();
                onTransitionClick(dossier);
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
            aria-label={`Modifier ${dossier.reference}`}
            title="Modifier"
            onClick={() => onEdit(dossier.id)}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export function DossiersListTable({
  filtered,
  paged,
  startIdx,
  endIdx,
  safePage,
  totalPages,
  hasActiveFilters,
  canWrite,
  canTransition,
  transitionDossier,
  onPageChange,
  onTransitionDossierChange,
}: DossiersListTableProps) {
  const { openDossier, openDossierDetail } = useNav();

  const handleOpenDetail = useCallback(
    (id: string) => openDossierDetail(id),
    [openDossierDetail],
  );
  const handleEdit = useCallback(
    (id: string) => openDossier(id, "edit"),
    [openDossier],
  );
  const handleTransitionClick = useCallback(
    (dossier: Dossier) => onTransitionDossierChange(dossier),
    [onTransitionDossierChange],
  );

  return (
    <>
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
          <EmptyState
            icon={FolderKanban}
            title="Aucun dossier trouvé"
            description={
              hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau dossier."
                : "Commencez par enregistrer votre premier dossier de transit."
            }
            action={
              !hasActiveFilters && canWrite ? (
                <Button onClick={() => openDossier(null, "create")}>
                  <Plus className="size-4" />
                  Créer votre premier dossier
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((dossier) => (
                <DossierMobileCard key={dossier.id} dossier={dossier} onOpenDetail={handleOpenDetail} />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Référence
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Société
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
                  {paged.map((dossier) => (
                    <DossierTableRow
                      key={dossier.id}
                      dossier={dossier}
                      canTransition={canTransition}
                      onOpenDetail={handleOpenDetail}
                      onEdit={handleEdit}
                      onTransitionClick={handleTransitionClick}
                    />
                  ))}
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
              onPageChange={onPageChange}
            />
          </>
        )}
      </Card>

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
    </>
  );
}
