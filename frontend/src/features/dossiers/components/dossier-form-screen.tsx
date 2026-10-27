"use client";

import {
  ArrowLeft,
  Save,
  FileText,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { DossierStatutBadge, StatutPaiementBadge, ToneBadge } from "@/components/sltt/status-badge";
import { InfoCallout } from "@/components/sltt/info-callout";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { useUnsavedChangesWarning } from "@/shared/hooks/use-unsaved-changes-warning";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { cn } from "@/shared/utils/cn";
import { useDossierFormState } from "./dossier-form/use-dossier-form-state";
import { useDossierFormActions } from "./dossier-form/use-dossier-form-actions";
import {
  DossierAmountsSection,
  DossierWizardProgress,
  DossierIdentityStep,
  DossierTransportSection,
  DossierWizardNav,
  SectionTitle,
  SummaryRow,
} from "./dossier-form";
import { DossierPaiementsSection } from "./dossier-form/dossier-paiements-section";
import { DossierDepensesSection } from "./dossier-form/dossier-depenses-section";

export function DossierFormScreen() {
  const { selectedId, dossierFormMode } = useNav();
  return (
    <DossierFormInner key={`${dossierFormMode}-${selectedId ?? "new"}`} />
  );
}

function DossierFormInner() {
  const { selectedId, dossierFormMode, go } = useNav();

  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const dossiers = useStore((s) => s.dossiers);
  const dossierSeq = useStore((s) => s.dossierSeq);
  const { annexes, activeAnnexeId } = useActiveAnnexe();

  const isEdit = dossierFormMode === "edit";
  const existing =
    isEdit && selectedId ? dossiers.find((d) => d.id === selectedId) : undefined;

  const form = useDossierFormState({
    existing,
    isEdit,
    dossierSeq,
    dossiers,
    societes,
    annexes,
    defaultAnnexeId: activeAnnexeId ?? undefined,
  });
  const annexeCode = annexes.find((a) => a.id === form.annexeId)?.code;

  const { canWrite, saving, handleFieldBlur, handleBack, handleSave, handlePdf } = useDossierFormActions({
    form,
    isEdit,
    selectedId,
  });

  useUnsavedChangesWarning(form.isDirty);

  if (isEdit && selectedId && !existing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Info className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le dossier demandé n&apos;existe pas ou a été supprimé.
          </p>
        </div>
        <Button variant="outline" onClick={() => go("dossiers")}>
          <ArrowLeft className="size-4" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="-ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        onClick={handleBack}
      >
        <ArrowLeft className="size-4" />
        Retour à la liste
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEdit ? `Dossier ${form.reference}` : "Nouveau dossier de transit"}
          </h1>
          <span className="rounded-md px-2 py-1 font-mono text-xs text-slate-500 bg-muted dark:text-slate-400">
            {form.reference}
          </span>
          <DossierStatutBadge statut={form.statut} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canWrite || saving}
            className="gap-2"
            title={
              !canWrite ? "Vous n'avez pas la permission d'enregistrer un dossier." : undefined
            }
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving
              ? "Enregistrement en cours…"
              : isEdit
                ? "Enregistrer les modifications"
                : "Créer le dossier"}
          </Button>
        </div>
      </div>

      {!canWrite && (
        <InfoCallout className="border-amber-200/80 bg-amber-50/60 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Vous consultez ce formulaire en lecture seule — vous n&apos;avez pas la permission
          d&apos;enregistrer un dossier.
        </InfoCallout>
      )}

      {form.isDirty && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300 dark:bg-amber-950/40">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          Modifications non enregistrées — pensez à sauvegarder.
        </div>
      )}

      {(form.showWizard || isEdit) && (
        <DossierWizardProgress
          wizardStep={form.wizardStep}
          mode={isEdit ? "sections" : "wizard"}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {form.showStep(1) && (
            <DossierIdentityStep
              clients={clients}
              annexes={annexes}
              annexeId={form.annexeId}
              clientId={form.clientId}
              existingClientNom={existing?.clientNom}
              nature={form.nature}
              bl={form.bl}
              camion={form.camion}
              date={form.date}
              errors={form.errors}
              touched={form.touched}
              onAnnexeIdChange={form.setAnnexeId}
              onClientIdChange={form.setClientId}
              onNatureChange={form.setNature}
              onBlChange={form.setBl}
              onCamionChange={form.setCamion}
              onDateChange={form.setDate}
              onFieldBlur={handleFieldBlur}
              onValidateField={form.validateField}
              onTouch={(field) => form.setTouched((p) => ({ ...p, [field]: true }))}
            />
          )}

          {form.showStep(2) && (
            <DossierAmountsSection
              totalContrat={form.totalContrat}
              onTotalContratChange={form.setTotalContrat}
            />
          )}

          {form.showStep(2) && (
            <DossierPaiementsSection
              paiements={form.paiements}
              montantPaye={form.finances.montantPaye}
              totalContrat={form.finances.totalContrat}
              onChange={form.updatePaiement}
              onAdd={form.addPaiement}
              onRemove={form.removePaiement}
            />
          )}

          {form.showStep(2) && (
            <DossierDepensesSection
              depenses={form.depenses}
              totalDepenses={form.finances.totalDepenses}
              onChange={form.updateDepense}
              onAdd={form.addDepense}
              onRemove={form.removeDepense}
            />
          )}

          {form.showStep(3) && (
            <DossierTransportSection
              isEdit={isEdit}
              modeTransport={form.modeTransport}
              portEntree={form.portEntree}
              noConteneur={form.noConteneur}
              poidsTotal={form.poidsTotal}
              nombreColis={form.nombreColis}
              onNombreColisChange={form.setNombreColis}
              isMali={annexeCode === "ML" || annexes.find((a) => a.id === form.annexeId)?.nom?.toLowerCase().includes("mali")}
              onModeTransportChange={form.setModeTransport}
              onPortEntreeChange={form.setPortEntree}
              onNoConteneurChange={form.setNoConteneur}
              onPoidsTotalChange={form.setPoidsTotal}
            />
          )}

          {form.showWizard && (
            <DossierWizardNav
              wizardStep={form.wizardStep}
              canWrite={canWrite}
              saving={saving}
              onPrev={form.goPrevStep}
              onNext={form.goNextStep}
              onSave={handleSave}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-24">
            <Card className="border-border/80 p-5 shadow-sm">
              <SectionTitle
                icon={<Info className="size-4" />}
                tone="amber"
                title="Récapitulatif"
                description="Synthèse des montants saisis"
              />

              <div className="divide-y divide-border">
                <SummaryRow label="Total contrat" value={formatFCFA(form.finances.totalContrat)} />
                <SummaryRow label="Montant payé" value={formatFCFA(form.finances.montantPaye)} />
                <SummaryRow
                  label={form.finances.resteAPayer < 0 ? "Trop-perçu" : "Reste à payer"}
                  value={formatFCFA(Math.abs(form.finances.resteAPayer))}
                  tone={
                    form.finances.resteAPayer > 0
                      ? "amber"
                      : form.finances.resteAPayer === 0
                        ? "emerald"
                        : undefined
                  }
                />
                <SummaryRow label="Dépenses" value={formatFCFA(form.finances.totalDepenses)} />
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="text-xs text-muted-foreground">Bénéfice net</div>
                <div
                  className={cn(
                    "mt-1 text-3xl font-bold tabular-nums",
                    form.finances.beneficeNet >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {formatFCFA(form.finances.beneficeNet)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatutPaiementBadge statut={form.finances.statutPaiement} />
                  {form.finances.perte && (
                    <ToneBadge tone="red" icon={AlertTriangle}>
                      Perte
                    </ToneBadge>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={!canWrite || saving}
                  title={
                    !canWrite
                      ? "Vous n'avez pas la permission d'enregistrer un dossier."
                      : undefined
                  }
                >
                  <Save className="size-4" />
                  Enregistrer le dossier
                </Button>
                <Button variant="outline" className="w-full" onClick={handlePdf}>
                  <FileText className="size-4" />
                  Générer le PDF
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={form.confirmLeaveOpen} onOpenChange={form.setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter sans sauvegarder ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Si vous quittez maintenant, ces
              modifications seront perdues définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester sur le formulaire</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => go("dossiers")}
            >
              Quitter sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
