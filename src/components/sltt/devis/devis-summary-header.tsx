"use client";

import { ChevronRight, FileCheck2, MoreHorizontal, Pencil, Printer, Save, Trash2, X } from "lucide-react";
import type { Devis, DevisStatut } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { canTransitionDevis } from "@/lib/status-flow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DevisStatutBadge } from "@/components/sltt/status-badge";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { NEXT_STATUT, STATUT_CONFIG, STATUTS_ALL } from "@/components/sltt/devis/devis-statut-config";

export function DevisSummaryHeader({
  devis, isEditing, canWrite, canEditContent, editValid, onStartEdit, onPrint,
  onStatutChange, onOpenDossier, onConvert, onDelete, onCancelEdit, onSave, saving = false,
}: {
  devis: Devis;
  isEditing: boolean;
  canWrite: boolean;
  canEditContent: boolean;
  editValid: boolean;
  onStartEdit: () => void;
  onPrint: () => void;
  onStatutChange: (statut: DevisStatut) => void;
  onOpenDossier: (id: string) => void;
  onConvert: () => void;
  onDelete: () => void;
  onCancelEdit: () => void;
  onSave: () => void | Promise<void>;
  saving?: boolean;
}) {
  const canEdit = !isEditing;
  const nextStatut = NEXT_STATUT[devis.statut];
  const openDossierDetail = onOpenDossier;
  const handlePrint = onPrint;
  const handleStatutChange = onStatutChange;
  const handleCancelEdit = onCancelEdit;
  const handleSave = onSave;
  const setIsEditing = (value: boolean) => value && onStartEdit();
  const setConfirmDelete = (value: boolean) => value && onDelete();
  const setConfirmConvert = (value: boolean) => value && onConvert();
  const fSocieteId = editValid ? "valid" : "";
  const fClientId = fSocieteId;
  const fNature = fSocieteId;
  const fDateValidite = fSocieteId;
  return (
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="flex">
          <div className="flex-1 p-5 sm:p-6">
            {/* Top row: reference + total */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{devis.reference}</h1>
                  <DevisStatutBadge statut={devis.statut} size="md" />
                  <SocieteBadge societeNom={devis.societeNom} size="sm" />
                  {devis.dossierId && (
                    <button
                      onClick={() => openDossierDetail(devis.dossierId!)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100"
                    >
                      <FileCheck2 className="size-3" /> Dossier créé
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-base font-semibold text-foreground/90">{devis.clientNom}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{devis.nature}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Créé le {formatDateShort(devis.dateCreation)}
                  &nbsp;·&nbsp; Valide jusqu'au {formatDateShort(devis.dateValidite)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Total estimé</p>
                <p className="mt-0.5 text-3xl font-extrabold tabular-nums text-blue-700 dark:text-blue-300 leading-tight">
                  {formatFCFA(devis.total, false)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">FCFA</p>
              </div>
            </div>

            {/* Action toolbar */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
              {canEdit ? (
                <>
                  {canEditContent && (
                    <Button size="sm" variant="outline" className="gap-2"
                      onClick={() => { setIsEditing(true); setConfirmDelete(false); setConfirmConvert(false); }}>
                      <Pencil className="size-4" /> Modifier
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="size-4" /> Télécharger PDF
                  </Button>
                  {nextStatut && canWrite && (
                    <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => handleStatutChange(nextStatut.to)}>
                      <ChevronRight className="size-4" /> {nextStatut.label}
                    </Button>
                  )}
                  {devis.dossierId ? (
                    <Button size="sm" variant="outline"
                      className="gap-2 text-emerald-700 dark:text-emerald-300 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/40"
                      onClick={() => openDossierDetail(devis.dossierId!)}>
                      <FileCheck2 className="size-4" /> Voir le dossier
                    </Button>
                  ) : canWrite && devis.statut === "Accepté" ? (
                    <Button size="sm" variant="outline"
                      className="gap-2 text-emerald-700 dark:text-emerald-300 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/40"
                      onClick={() => { setConfirmConvert(true); setConfirmDelete(false); }}>
                      <FileCheck2 className="size-4" /> Convertir en dossier
                    </Button>
                  ) : null}
                  {canWrite && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {STATUTS_ALL.map((s) => {
                        const SIcon = STATUT_CONFIG[s].icon;
                        const disabled = s === devis.statut || !canTransitionDevis(devis.statut, s);
                        return (
                          <DropdownMenuItem
                            key={s}
                            disabled={disabled}
                            onClick={() => handleStatutChange(s)}
                            className={disabled ? "opacity-50 cursor-default" : ""}
                          >
                            <SIcon className="mr-2 size-3.5" />
                            {s}
                            {s === devis.statut && <span className="ml-auto text-[10px] text-muted-foreground">actuel</span>}
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-700"
                        onClick={() => { setConfirmDelete(true); setConfirmConvert(false); }}
                      >
                        <Trash2 className="mr-2 size-3.5" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleCancelEdit}>
                    <X className="size-4" /> Annuler
                  </Button>
                  <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={!fSocieteId || !fClientId || !fNature.trim() || !fDateValidite || saving}
                    onClick={() => void handleSave()}>
                    <Save className="size-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
  );
}
