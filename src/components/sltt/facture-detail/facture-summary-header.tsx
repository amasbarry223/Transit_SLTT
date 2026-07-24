"use client";

import {
  AlertTriangle,
  ChevronRight,
  CreditCard,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Printer,
  Save,
  X,
  XCircle,
} from "lucide-react";
import type { Dossier, Facture, FactureStatut } from "@/lib/store";
import type { SocieteBrand } from "@/lib/export";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { canTransitionFacture } from "@/lib/status-flow";
import { FactureStatutBadge } from "@/components/sltt/status-badge";
import { FactureDocumentHeader } from "@/components/sltt/facture-document-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STATUT_CONFIG, STATUTS_ALL } from "./facture-statut-config";

export function FactureSummaryHeader({
  facture,
  factureBrand,
  dossier,
  reste,
  isEchue,
  isEditing,
  canEdit,
  canRecordPaiement,
  nextStatut,
  canWrite,
  onPrint,
  onStartEdit,
  onShowPaiement,
  onStatutClick,
  onOpenDossier,
  onCancelEdit,
  onSaveEdit,
  onConfirmAnnuler,
}: {
  facture: Facture;
  factureBrand: SocieteBrand | null;
  dossier: Dossier | null | undefined;
  reste: number;
  isEchue: boolean;
  isEditing: boolean;
  canEdit: boolean;
  canRecordPaiement: boolean;
  nextStatut: { to: FactureStatut; label: string } | undefined;
  canWrite: boolean;
  onPrint: () => void;
  onStartEdit: () => void;
  onShowPaiement: () => void;
  onStatutClick: (s: FactureStatut) => void;
  onOpenDossier: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onConfirmAnnuler: () => void;
}) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="flex border-l-4 border-blue-600">
        <div className="flex-1 p-5 sm:p-6">
          {factureBrand && <FactureDocumentHeader brand={factureBrand} />}
          <div className={cn("flex flex-wrap items-start justify-between gap-4", factureBrand && "mt-4")}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {facture.numero}
                </h1>
                <FactureStatutBadge statut={facture.statut} showIcon size="md" />
                {dossier && (
                  <button
                    onClick={() => onOpenDossier(dossier.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    <FolderKanban className="size-3" />
                    {dossier.reference}
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-base font-semibold text-slate-700 dark:text-slate-300">{facture.clientNom}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Émise le {formatDateShort(facture.date)}
                &nbsp;·&nbsp; Échéance {formatDateShort(facture.dateEcheance)}
                &nbsp;·&nbsp; Créée par {facture.creePar}
              </p>
              {isEchue && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  <AlertTriangle className="size-3.5" />
                  Échéance dépassée depuis le {formatDateShort(facture.dateEcheance)}
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Total TTC</p>
              <p className="mt-0.5 text-3xl font-extrabold tabular-nums leading-tight text-blue-700">
                {formatFCFA(facture.montantTTC, false)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">FCFA</p>
              {facture.montantPaye > 0 && facture.statut !== "Soldée" && (
                <p className="mt-1 text-xs font-semibold text-amber-600">
                  Reste {formatFCFA(reste)}
                </p>
              )}
            </div>
          </div>

          {/* Barre d'actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
            {!isEditing ? (
              <>
                <Button size="sm" variant="outline" className="gap-2" onClick={onPrint}>
                  <Printer className="size-4" /> Télécharger PDF
                </Button>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={onStartEdit}
                  >
                    <Pencil className="size-4" /> Modifier
                  </Button>
                )}
                {canRecordPaiement && (
                  <Button
                    size="sm"
                    className="gap-2 bg-emerald-700 hover:bg-emerald-800"
                    onClick={onShowPaiement}
                  >
                    <CreditCard className="size-4" /> Enregistrer paiement
                  </Button>
                )}
                {nextStatut && facture.statut !== "Annulée" && canWrite && (
                  <Button
                    size="sm"
                    className="gap-2 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => onStatutClick(nextStatut.to)}
                  >
                    <ChevronRight className="size-4" /> {nextStatut.label}
                  </Button>
                )}
                {dossier && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-indigo-950/40"
                    onClick={() => onOpenDossier(dossier.id)}
                  >
                    <FolderKanban className="size-4" /> Voir le dossier
                  </Button>
                )}
                {canWrite && facture.statut !== "Annulée" && facture.statut !== "Soldée" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="ml-auto text-slate-400">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {STATUTS_ALL.filter((s) => s !== "Annulée" && s !== "Partielle").map((s) => {
                        const SIcon = STATUT_CONFIG[s].icon;
                        const disabled = s === facture.statut || !canTransitionFacture(facture.statut, s);
                        return (
                          <DropdownMenuItem
                            key={s}
                            disabled={disabled}
                            onClick={() => onStatutClick(s)}
                          >
                            <SIcon className="mr-2 size-3.5" />
                            {s}
                            {s === facture.statut && (
                              <span className="ml-auto text-[10px] text-slate-400">actuel</span>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40"
                        onClick={onConfirmAnnuler}
                      >
                        <XCircle className="mr-2 size-3.5" /> Annuler la facture
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="gap-2" onClick={onCancelEdit}>
                  <X className="size-4" /> Annuler
                </Button>
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={onSaveEdit}>
                  <Save className="size-4" /> Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
