"use client";

import {
  ArrowLeft,
  Save,
  FileText,
  Info,
  AlertTriangle,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { printHTML, htmlEscape } from "@/lib/export";
import { resolvePrintHTMLBrand } from "@/lib/societe-brand";
import { DossierStatutBadge } from "@/components/sltt/status-badge";
import { InfoCallout } from "@/components/sltt/info-callout";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { TransitionDialog } from "@/components/sltt/dossier-transition-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
import { useDossierFormState } from "@/components/sltt/dossier-form/use-dossier-form-state";
import { DossierAmountsSection } from "@/components/sltt/dossier-form/dossier-amounts-section";
import {
  DossierWizardProgress,
  DossierIdentityStep,
  DossierTransportSection,
  DossierSuiviSection,
  DossierWizardNav,
} from "@/components/sltt/dossier-form/dossier-wizard-steps";
import { SectionTitle, SummaryRow } from "@/components/sltt/dossier-form/dossier-form-ui";

export function DossierFormScreen() {
  const { selectedId, dossierFormMode } = useNav();
  return (
    <DossierFormInner key={`${dossierFormMode}-${selectedId ?? "new"}`} />
  );
}

function DossierFormInner() {
  const { selectedId, dossierFormMode, go } = useNav();
  const { toast } = useToast();
  const canWrite = usePermission("dossiers:write");
  const canTransition = usePermission("dossiers:transition");

  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const dossiers = useStore((s) => s.dossiers);
  const addDossier = useStore((s) => s.addDossier);
  const updateDossier = useStore((s) => s.updateDossier);
  const dossierSeq = useStore((s) => s.dossierSeq);

  const isEdit = dossierFormMode === "edit";
  const existing =
    isEdit && selectedId ? dossiers.find((d) => d.id === selectedId) : undefined;

  const form = useDossierFormState({ existing, isEdit, dossierSeq });

  if (isEdit && selectedId && !existing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Info className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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

  function handleFieldBlur(field: keyof typeof form.errors) {
    form.setTouched((p) => ({ ...p, [field]: true }));
    const values: Record<keyof typeof form.errors, string> = {
      clientId: form.clientId,
      nature: form.nature,
      bl: form.bl,
      camion: form.camion,
      date: form.date,
    };
    form.validateField(field, values[field]);
  }

  function handleBack() {
    if (form.isDirty) {
      form.setConfirmLeaveOpen(true);
    } else {
      go("dossiers");
    }
  }

  function handleSave() {
    if (!canWrite) {
      toast({
        title: "Action non autorisée",
        description: "Vous n'avez pas la permission d'enregistrer un dossier.",
        variant: "destructive",
      });
      return;
    }
    if (!form.validate()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    const clientNom = clients.find((c) => c.id === form.clientId)?.nom ?? "";
    const input = form.buildSaveInput(clientNom);
    if (isEdit && selectedId) {
      updateDossier(selectedId, input);
      toast({ title: "Succès", description: "Dossier mis à jour." });
    } else {
      addDossier(input);
      toast({ title: "Succès", description: "Dossier créé avec succès." });
    }
    go("dossiers");
  }

  function handlePdf() {
    const clientNom = clients.find((c) => c.id === form.clientId)?.nom ?? "—";
    printHTML(
      `Dossier ${form.reference}`,
      `
      <h1>Dossier de transit</h1>
      <div class="subtitle">Référence : <strong>${htmlEscape(form.reference)}</strong> · Statut : ${htmlEscape(form.statut)}</div>
      <table>
        <tbody>
          <tr><th style="width:35%">Client</th><td>${htmlEscape(clientNom)}</td></tr>
          <tr><th>Nature de la marchandise</th><td>${htmlEscape(form.nature) || "—"}</td></tr>
          <tr><th>N° de BL</th><td>${htmlEscape(form.bl) || "—"}</td></tr>
          <tr><th>N° du camion</th><td>${htmlEscape(form.camion) || "—"}</td></tr>
          <tr><th>Date</th><td>${form.date ? formatDateShort(form.date) : "—"}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top:24px;font-size:14px;color:#1e40af">Montants (FCFA)</h2>
      <table>
        <tbody>
          <tr><th style="width:35%">Droit de douane</th><td class="num">${formatFCFA(form.dN, false)}</td></tr>
          <tr><th>Frais de circuit global</th><td class="num">${formatFCFA(form.fN, false)}</td></tr>
          <tr><th>Frais de prestation</th><td class="num">${formatFCFA(form.pN, false)}</td></tr>
          <tr><th>Montant investi</th><td class="num">${formatFCFA(form.iN, false)}</td></tr>
          <tr><th>Montant payé</th><td class="num">${formatFCFA(form.montantPaye, false)}</td></tr>
          <tr><th>Reste à payer</th><td class="num">${formatFCFA(form.reste, false)}</td></tr>
          <tr class="total-row">
            <th>Marge calculée</th>
            <td class="num" style="color:${form.ecart >= 0 ? "#059669" : "#dc2626"}">
              ${form.ecart >= 0 ? "+" : ""}${form.ecart.toLocaleString("fr-FR")}
            </td>
          </tr>
        </tbody>
      </table>
      ${form.notes ? `<h2 style="margin-top:24px;font-size:14px;color:#1e40af">Notes</h2><p style="font-size:13px;color:#475569;white-space:pre-wrap">${htmlEscape(form.notes)}</p>` : ""}
    `,
      resolvePrintHTMLBrand(societes),
    );
    toast({
      title: "PDF généré",
      description: "Le document s'est ouvert dans une nouvelle fenêtre.",
    });
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isEdit ? `Dossier ${form.reference}` : "Nouveau dossier de transit"}
          </h1>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
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
            disabled={!canWrite}
            title={
              !canWrite ? "Vous n'avez pas la permission d'enregistrer un dossier." : undefined
            }
          >
            <Save className="size-4" />
            Enregistrer
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
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-950/40">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          Modifications non enregistrées — pensez à sauvegarder.
        </div>
      )}

      {form.showWizard && <DossierWizardProgress wizardStep={form.wizardStep} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {form.showStep(1) && (
            <DossierIdentityStep
              clients={clients}
              clientId={form.clientId}
              nature={form.nature}
              bl={form.bl}
              camion={form.camion}
              date={form.date}
              errors={form.errors}
              touched={form.touched}
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

          {form.showStep(3) && (
            <DossierTransportSection
              isEdit={isEdit}
              modeTransport={form.modeTransport}
              portEntree={form.portEntree}
              noConteneur={form.noConteneur}
              poidsTotal={form.poidsTotal}
              onModeTransportChange={form.setModeTransport}
              onPortEntreeChange={form.setPortEntree}
              onNoConteneurChange={form.setNoConteneur}
              onPoidsTotalChange={form.setPoidsTotal}
            />
          )}

          {form.showStep(2) && (
            <DossierAmountsSection
              droitDouane={form.droitDouane}
              fraisCircuit={form.fraisCircuit}
              fraisPrestation={form.fraisPrestation}
              onDroitDouaneChange={form.setDroitDouane}
              onFraisCircuitChange={form.setFraisCircuit}
              onFraisPrestationChange={form.setFraisPrestation}
              montantInvesti={form.iN}
              ecart={form.ecart}
            />
          )}

          {form.showStep(3) && (
            <DossierSuiviSection
              isEdit={isEdit}
              statut={form.statut}
              nextTransition={form.nextTransition}
              canTransition={canTransition}
              dateEcheance={form.dateEcheance}
              dateDedouanement={form.dateDedouanement}
              notes={form.notes}
              onTransitionOpen={() => form.setTransitionOpen(true)}
              onDateEcheanceChange={form.setDateEcheance}
              onDateDedouanementChange={form.setDateDedouanement}
              onNotesChange={form.setNotes}
            />
          )}

          {form.showWizard && (
            <DossierWizardNav
              wizardStep={form.wizardStep}
              canWrite={canWrite}
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
                <SummaryRow label="Frais prestation" value={formatFCFA(form.pN)} />
                <SummaryRow label="Montant investi" value={formatFCFA(form.iN)} />
                <SummaryRow label="Reste à payer" value={formatFCFA(form.reste)} tone="amber" />
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Marge</div>
                <div
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    form.ecart >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {form.ecart >= 0 ? "+" : ""}
                  {formatFCFA(form.ecart)}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {form.ecart >= 0
                    ? "Marge positive sur ce dossier."
                    : "Marge négative — à surveiller."}
                </p>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={!canWrite}
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

      {isEdit && existing && form.nextTransition && (
        <TransitionDialog
          dossier={existing}
          transition={form.nextTransition}
          open={form.transitionOpen}
          onOpenChange={form.setTransitionOpen}
        />
      )}
    </div>
  );
}
