"use client";

import * as React from "react";
import { ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useStore,
  type FactureStatut,
} from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { useSession } from "@/lib/session/session-store";
import { usePermission } from "@/hooks/use-permission";
import { formatFCFA } from "@/lib/format";
import { resteAPayer } from "@/lib/domain-types";
import { printFactureModule, type SocieteBrand } from "@/lib/export";
import { mergeAnnexeIntoBrand, resolveSlttBrand, societeToBrand } from "@/lib/societe-brand";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";

import { NEXT_STATUT } from "./facture-detail/facture-statut-config";
import { FactureSummaryHeader } from "./facture-detail/facture-summary-header";
import { InformationsCard } from "./facture-detail/informations-card";
import { LignesCard } from "./facture-detail/lignes-card";
import { SuiviPaiementCard } from "./facture-detail/suivi-paiement-card";
import { PipelineCard } from "./facture-detail/pipeline-card";
import { ActionsCard } from "./facture-detail/actions-card";
import { FactureEditForm } from "./facture-detail/facture-edit-form";
import { PaiementDialog } from "./facture-detail/paiement-dialog";
import { useFactureEditState } from "./facture-detail/use-facture-edit-state";

export function FactureDetailScreen() {
  const selectedId = useNav((s) => s.selectedId);
  const go = useNav((s) => s.go);
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const factures = useStore((s) => s.factures);
  const societes = useStore((s) => s.societes);
  const annexes = useStore((s) => s.annexes);
  const updateFactureStatut = useStore((s) => s.updateFactureStatut);
  const recordFacturePaiement = useStore((s) => s.recordFacturePaiement);
  const updateFacture = useStore((s) => s.updateFacture);
  const dossiers = useStore((s) => s.dossiers);
  const { toast } = useToast();
  const canWrite = usePermission("factures:write");
  const currentUserName = useSession((s) => s.currentUserName);

  const facture = factures.find((f) => f.id === selectedId);

  const factureBrand = React.useMemo((): SocieteBrand | null => {
    if (!facture) return null;
    const societe = facture.societeId
      ? societes.find((s) => s.id === facture.societeId)
      : undefined;
    const base = societe ? societeToBrand(societe) : resolveSlttBrand(societes);
    if (!base) return null;
    const annexe = annexes.find((a) => a.id === facture.annexeId);
    return annexe ? mergeAnnexeIntoBrand(base, annexe) : base;
  }, [facture, societes, annexes]);

  const [showPaiement, setShowPaiement] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [confirmSolde, setConfirmSolde] = React.useState(false);
  const [confirmAnnuler, setConfirmAnnuler] = React.useState(false);

  const editState = useFactureEditState(facture, isEditing);

  useUnsavedChangesWarning(isEditing);

  if (!facture) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <Receipt className="size-14 text-muted-foreground/70" />
        <p className="mt-4 text-sm font-semibold text-muted-foreground">Facture introuvable</p>
        <Button variant="outline" className="mt-5" onClick={() => go("factures")}>
          <ArrowLeft className="mr-2 size-4" /> Retour aux factures
        </Button>
      </div>
    );
  }

  const dossier = facture.dossierId ? dossiers.find((d) => d.id === facture.dossierId) : null;
  const reste = resteAPayer({ montantInvesti: facture.montantTTC, montantPaye: facture.montantPaye });
  const pctPaye = facture.montantTTC > 0 ? Math.round((facture.montantPaye / facture.montantTTC) * 100) : 0;
  const isEchue =
    facture.statut !== "Soldée" &&
    facture.statut !== "Annulée" &&
    facture.dateEcheance < new Date().toISOString().slice(0, 10);
  const nextStatut = NEXT_STATUT[facture.statut];
  const canEdit = facture.statut === "Brouillon" && !isEditing && canWrite;
  const canRecordPaiement =
    canWrite && facture.statut !== "Soldée" && facture.statut !== "Annulée" && facture.statut !== "Brouillon";

  async function handleStatutClick(s: FactureStatut) {
    if (!facture || !canWrite) return;
    if (s === facture.statut) return;
    if (s === "Soldée") {
      setConfirmSolde(true);
      return;
    }
    try {
      await updateFactureStatut(facture.id, s);
      toastSuccess(toast, { title: "Statut mis à jour", description: `${facture.numero} → ${s}` });
    } catch (err: unknown) {
      toastWarning(toast, {
        title: "Transition impossible",
        description: err instanceof Error ? err.message : "Cette transition de statut n'est pas autorisée.",
      });
    }
  }

  async function handleSaveEdit() {
    if (!facture || !canWrite || savingEdit) return;
    const input = editState.buildFactureInput();
    if (!input) {
      toastWarning(toast, {
        title: "Facture incomplète",
        description: "Ajoutez au moins une ligne de facturation avec une description avant d'enregistrer.",
      });
      return;
    }
    setSavingEdit(true);
    try {
      await updateFacture(facture.id, input);
      toastSuccess(toast, { title: "Facture mise à jour", description: facture.numero });
      setIsEditing(false);
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible de mettre à jour la facture",
        fallback: "Impossible de mettre à jour la facture.",
      });
    } finally {
      setSavingEdit(false);
    }
  }

  function handlePrint() {
    if (!facture || !factureBrand) return;
    const memesAnnexe = factures
      .filter((f) => f.annexeId === facture.annexeId)
      .sort((a, b) => a.creeLe.localeCompare(b.creeLe));
    const annexeSeq = memesAnnexe.findIndex((f) => f.id === facture.id) + 1;
    const villeSiege = annexes.find((a) => a.id === facture.annexeId)?.villeSiege;
    printFactureModule({
      numero: facture.numero,
      annexeSeq: annexeSeq > 0 ? annexeSeq : undefined,
      villeSiege,
      clientNom: facture.clientNom,
      date: facture.date,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      lignes: facture.lignes,
      tauxTVA: facture.tauxTVA,
      montantHT: facture.montantHT,
      montantTVA: facture.montantTVA,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye,
      notes: facture.notes,
      genereParNom: currentUserName || facture.creePar,
      dossierReference: dossier?.reference,
      dossierBl: dossier?.bl,
    }, factureBrand);
  }

  return (
    <div className="space-y-6 pb-12">
      {showPaiement && (
        <PaiementDialog facture={facture} open={showPaiement} onOpenChange={setShowPaiement} />
      )}

      {/* Retour */}
      <button
        onClick={() => go("factures")}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Retour aux factures
      </button>

      {/* Carte résumé */}
      <FactureSummaryHeader
        facture={facture}
        factureBrand={factureBrand}
        dossier={dossier}
        reste={reste}
        isEchue={isEchue}
        isEditing={isEditing}
        canEdit={canEdit}
        canRecordPaiement={canRecordPaiement}
        nextStatut={nextStatut}
        canWrite={canWrite}
        savingEdit={savingEdit}
        onPrint={handlePrint}
        onStartEdit={() => setIsEditing(true)}
        onShowPaiement={() => setShowPaiement(true)}
        onStatutClick={handleStatutClick}
        onOpenDossier={openDossierDetail}
        onCancelEdit={() => setIsEditing(false)}
        onSaveEdit={handleSaveEdit}
        onConfirmAnnuler={() => setConfirmAnnuler(true)}
      />

      {/* Mode visualisation */}
      {!isEditing && (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Colonne gauche */}
          <div className="space-y-5 lg:col-span-3">
            <InformationsCard facture={facture} dossier={dossier} isEchue={isEchue} />
            <LignesCard facture={facture} />

            {facture.notes && (
              <Card className="border-border/80 shadow-sm">
                <div className="border-b border-border/60 px-5 py-3 bg-muted/60">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Notes</h2>
                </div>
                <p className="px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {facture.notes}
                </p>
              </Card>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-5 lg:col-span-2">
            {facture.statut !== "Annulée" && (
              <SuiviPaiementCard
                facture={facture}
                pctPaye={pctPaye}
                reste={reste}
                isEchue={isEchue}
                canRecordPaiement={canRecordPaiement}
                onShowPaiement={() => setShowPaiement(true)}
              />
            )}

            <PipelineCard facture={facture} canWrite={canWrite} onSelect={handleStatutClick} />

            <ActionsCard
              facture={facture}
              dossier={dossier}
              canEdit={canEdit}
              canRecordPaiement={canRecordPaiement}
              canWrite={canWrite}
              onPrint={handlePrint}
              onStartEdit={() => setIsEditing(true)}
              onShowPaiement={() => setShowPaiement(true)}
              onOpenDossier={openDossierDetail}
              onConfirmAnnuler={() => setConfirmAnnuler(true)}
            />
          </div>
        </div>
      )}

      {/* Mode édition */}
      {isEditing && (
        <FactureEditForm facture={facture} societes={societes} editState={editState} />
      )}

      <AlertDialog open={confirmSolde} onOpenChange={setConfirmSolde}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solder cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un encaissement de <strong>{formatFCFA(reste)}</strong> sera enregistré pour couvrir le
              reste dû ({formatFCFA(facture.montantPaye)} déjà payés sur {formatFCFA(facture.montantTTC)}{" "}
              TTC). La facture passera automatiquement au statut <strong>Soldée</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await recordFacturePaiement(facture.id, reste);
                  toastSuccess(toast, { title: "Facture soldée", description: `${facture.numero} — encaissement de ${formatFCFA(reste)} enregistré.` });
                } catch (err: unknown) {
                  toastError(toast, err, {
                    title: "Encaissement impossible",
                    fallback: "Impossible d'enregistrer le paiement.",
                  });
                }
                setConfirmSolde(false);
              }}
            >
              Confirmer le solde
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAnnuler} onOpenChange={setConfirmAnnuler}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler définitivement cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              La facture <strong>{facture.numero}</strong> passera au statut <strong>Annulée</strong>, un statut
              terminal sans retour possible. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await handleStatutClick("Annulée");
                setConfirmAnnuler(false);
              }}
            >
              Confirmer l&apos;annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
