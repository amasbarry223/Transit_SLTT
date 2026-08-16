"use client";

import { ClipboardList, ExternalLink, Eye, FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { DossierIcon } from "@/shared/components/icons/dossier-icon";
import type { Dispatch, SetStateAction } from "react";
import type { Devis, DevisStatut } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/sltt/empty-state";
import { UI } from "@/lib/ui-messages";
import { DevisStatutBadge } from "@/components/sltt/status-badge";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { StatusQuickAction } from "@/components/sltt/status-quick-action";
import { TablePagination } from "@/components/sltt/table-pagination";
import { NEXT_STATUT } from "@/components/sltt/devis/devis-statut-config";

export function DevisListTable({
  filtered, paged, hasActiveFilters, canWrite, setEditDevis, setFormOpen,
  handleOpenDevis, handleOpenEdit, handlePrintDevis, handleQuickStatut,
  openDossierDetail, setConvertTarget, setDeleteTarget,
  startIdx, endIdx, safePage, totalPages, setPage,
}: {
  filtered: Devis[];
  paged: Devis[];
  hasActiveFilters: boolean;
  canWrite: boolean;
  setEditDevis: Dispatch<SetStateAction<Devis | null>>;
  setFormOpen: Dispatch<SetStateAction<boolean>>;
  handleOpenDevis: (devis: Devis) => void;
  handleOpenEdit: (devis: Devis) => void;
  handlePrintDevis: (devis: Devis) => void;
  handleQuickStatut: (devis: Devis, statut: DevisStatut) => void;
  openDossierDetail: (id: string) => void;
  setConvertTarget: Dispatch<SetStateAction<Devis | null>>;
  setDeleteTarget: Dispatch<SetStateAction<Devis | null>>;
  startIdx: number;
  endIdx: number;
  safePage: number;
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
}) {
  return (
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ClipboardList className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Liste des devis</h2>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={hasActiveFilters ? UI.empty.devis.filtered.title : UI.empty.devis.zero.title}
            description={hasActiveFilters ? UI.empty.devis.filtered.description : UI.empty.devis.zero.description}
            action={
              !hasActiveFilters && canWrite ? (
                <Button onClick={() => { setEditDevis(null); setFormOpen(true); }}>
                  <Plus className="size-4" />
                  {UI.empty.devis.zero.action}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((d) => {
                const next = NEXT_STATUT[d.statut];
                const isEnAttente = d.statut === "Envoyé";
                return (
                  <Card
                    key={d.id}
                    className={cn(
                      "cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60",
                      isEnAttente && "bg-blue-50/30 dark:bg-blue-950/20",
                    )}
                    onClick={() => handleOpenDevis(d)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-foreground">{d.reference}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground/90">{d.clientNom}</p>
                        {d.societeNom && (
                          <div className="mt-1">
                            <SocieteBadge societeNom={d.societeNom} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <DevisStatutBadge statut={d.statut} />
                        {d.dossierId ? (
                          <button
                            className="inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-50 dark:bg-emerald-950/40"
                            onClick={(e) => { e.stopPropagation(); openDossierDetail(d.dossierId!); }}
                          >
                            <DossierIcon className="size-3" /> Dossier
                          </button>
                        ) : next && canWrite && (
                          <StatusQuickAction
                            label={next.quickLabel}
                            bgClass={next.bgClass}
                            colorClass={next.colorClass}
                            onClick={(e) => { e.stopPropagation(); handleQuickStatut(d, next.to); }}
                          />
                        )}
                      </div>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">Nature</dt>
                        <dd className="truncate text-right text-foreground/90">{d.nature}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">Total estimé</dt>
                        <dd className="font-semibold tabular-nums text-foreground">{formatFCFA(d.total)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">Validité</dt>
                        <dd className="tabular-nums text-foreground/90">{formatDateShort(d.dateValidite)}</dd>
                      </div>
                    </dl>
                    <div
                      className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Voir" onClick={() => handleOpenDevis(d)}>
                        <Eye className="size-4" />
                      </Button>
                      {canWrite && !d.dossierId && d.statut !== "Accepté" && (
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Modifier" onClick={() => handleOpenEdit(d)}>
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => handleOpenDevis(d)}>
                            <ExternalLink className="mr-2 size-3.5" /> Ouvrir la fiche
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintDevis(d)}>
                            <FileText className="mr-2 size-3.5" /> Imprimer le devis
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {d.dossierId ? (
                            <DropdownMenuItem onClick={() => openDossierDetail(d.dossierId!)}>
                              <DossierIcon className="mr-2 size-3.5" /> Voir le dossier
                            </DropdownMenuItem>
                          ) : canWrite && d.statut === "Accepté" && (
                            <DropdownMenuItem
                              className="text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/40 focus:text-emerald-800"
                              onClick={() => setConvertTarget(d)}
                            >
                              <DossierIcon className="mr-2 size-3.5" /> Convertir en dossier
                            </DropdownMenuItem>
                          )}
                          {canWrite && (
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-700"
                              onClick={() => setDeleteTarget(d)}
                            >
                              <Trash2 className="mr-2 size-3.5" /> Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/50 hover:bg-muted">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Référence
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Client
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                      Société
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                      Nature marchandise
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Total estimé
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                      Validité
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Statut
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((d) => {
                    const next = NEXT_STATUT[d.statut];
                    const isEnAttente = d.statut === "Envoyé";
                    return (
                      <TableRow
                        key={d.id}
                        className={cn(
                          "cursor-pointer border-b border-border transition-colors hover:bg-muted/80",
                          isEnAttente && "bg-blue-50/30 dark:bg-blue-950/20",
                        )}
                        onClick={() => handleOpenDevis(d)}
                      >
                        <TableCell className="px-4 py-3.5">
                          <p className="font-mono text-xs font-semibold text-foreground">{d.reference}</p>
                          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{formatDateShort(d.dateCreation)}</p>
                        </TableCell>

                        <TableCell className="max-w-[180px] px-4 py-3.5">
                          <p className="truncate font-medium text-foreground/90">{d.clientNom}</p>
                        </TableCell>

                        <TableCell className="hidden px-4 py-3.5 lg:table-cell">
                          <SocieteBadge societeNom={d.societeNom} size="sm" />
                        </TableCell>

                        <TableCell className="hidden max-w-[200px] px-4 py-3.5 md:table-cell">
                          <span className="line-clamp-1 text-sm text-muted-foreground">{d.nature}</span>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-right">
                          <span className="font-semibold tabular-nums text-foreground">{formatFCFA(d.total)}</span>
                        </TableCell>

                        <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                          <span className="text-sm tabular-nums text-muted-foreground">{formatDateShort(d.dateValidite)}</span>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <DevisStatutBadge statut={d.statut} />
                            {d.dossierId ? (
                              <button
                                className="inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-50 dark:bg-emerald-950/40"
                                onClick={(e) => { e.stopPropagation(); openDossierDetail(d.dossierId!); }}
                              >
                                <DossierIcon className="size-3" /> Dossier créé
                              </button>
                            ) : next && canWrite && (
                              <StatusQuickAction
                                label={next.quickLabel}
                                bgClass={next.bgClass}
                                colorClass={next.colorClass}
                                onClick={(e) => { e.stopPropagation(); handleQuickStatut(d, next.to); }}
                              />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary"
                              title="Voir" onClick={() => handleOpenDevis(d)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            {canWrite && !d.dossierId && d.statut !== "Accepté" && (
                              <Button
                                variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary"
                                title="Modifier" onClick={() => handleOpenEdit(d)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => handleOpenDevis(d)}>
                                  <ExternalLink className="mr-2 size-3.5" /> Ouvrir la fiche
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrintDevis(d)}>
                                  <FileText className="mr-2 size-3.5" /> Imprimer le devis
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {d.dossierId ? (
                                  <DropdownMenuItem onClick={() => openDossierDetail(d.dossierId!)}>
                                    <DossierIcon className="mr-2 size-3.5" /> Voir le dossier
                                  </DropdownMenuItem>
                                ) : canWrite && d.statut === "Accepté" && (
                                  <DropdownMenuItem
                                    className="text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/40 focus:text-emerald-800"
                                    onClick={() => setConvertTarget(d)}
                                  >
                                    <DossierIcon className="mr-2 size-3.5" /> Convertir en dossier
                                  </DropdownMenuItem>
                                )}
                                {canWrite && (
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-700"
                                    onClick={() => setDeleteTarget(d)}
                                  >
                                    <Trash2 className="mr-2 size-3.5" /> Supprimer
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`devis`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
  );
}
