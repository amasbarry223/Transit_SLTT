"use client";

import { useState } from "react";
import { Truck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useStore, type Transporteur, type TransporteurInput } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import {
  TransporteurFormFields,
  TransporteurFormStepper,
  TRANSPORTEUR_FORM_STEPS,
  emptyTransporteurForm,
  isTransporteurFormValid,
  isTransporteurStepValid,
  maxReachableStep,
  validateTransporteurForm,
  validateTransporteurStep,
  firstInvalidTransporteurStep,
} from "@/components/sltt/transporteur-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransporteurFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  target?: Transporteur;
  onClose: () => void;
}

export function TransporteurFormModal({ open, mode, target, onClose }: TransporteurFormModalProps) {
  const addTransporteur = useStore((s) => s.addTransporteur);
  const updateTransporteur = useStore((s) => s.updateTransporteur);
  const { toast } = useToast();

  const isEdit = mode === "edit";
  const openKey = open ? (target?.id ?? "new") : null;
  const lastStep = TRANSPORTEUR_FORM_STEPS.length - 1;

  const [form, setForm] = useState<TransporteurInput>(emptyTransporteurForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TransporteurInput, string>>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      setForm(
        target
          ? {
              nom: target.nom,
              contact: target.contact,
              telephone: target.telephone,
              email: target.email ?? "",
              vehicule: target.vehicule,
              immatriculation: target.immatriculation,
              trajet: target.trajet,
              capacite: target.capacite,
              statut: target.statut,
              notes: target.notes ?? "",
            }
          : emptyTransporteurForm(),
      );
      setErrors({});
      setSaving(false);
      setStep(0);
    }
  }

  const valid = isTransporteurFormValid(form);
  const stepValid = isTransporteurStepValid(step, form);
  const completedThrough = maxReachableStep(form);
  const isLastStep = step === lastStep;

  const handleChange = (patch: Partial<TransporteurInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof TransporteurInput)[]) {
        delete next[key];
      }
      return next;
    });
  };

  const goToStep = (next: number) => {
    setStep(Math.max(0, Math.min(lastStep, next)));
    setErrors({});
  };

  const handleNext = () => {
    const stepErrors = validateTransporteurStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    goToStep(step + 1);
  };

  const handleBack = () => goToStep(step - 1);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const nextErrors = validateTransporteurForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStep(firstInvalidTransporteurStep(form));
      return;
    }
    setSaving(true);
    try {
      if (isEdit && target) {
        await updateTransporteur(target.id, form);
        toastSuccess(toast, { title: "Transporteur modifié", description: form.nom });
      } else {
        const t = await addTransporteur(form);
        toastSuccess(toast, { title: "Transporteur créé", description: t.nom });
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Impossible d'enregistrer le transporteur";
      toastError(toast, err, { title: "Impossible d'enregistrer", fallback: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-0 border-b border-border/60 px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Truck className="size-5" />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <DialogTitle className="text-lg">
                {isEdit ? "Modifier le transporteur" : "Nouveau transporteur"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEdit
                  ? `Mettez à jour les informations de ${target?.nom ?? "ce partenaire"}.`
                  : "Ajoutez un transporteur ou chauffeur partenaire à l'annuaire SLTT."}
              </DialogDescription>
              {isEdit && target && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground bg-muted">
                    {target.vehicule}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{target.immatriculation}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <TransporteurFormStepper
              currentStep={step}
              completedThrough={completedThrough}
              onStepClick={goToStep}
            />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-[320px] overflow-y-auto px-6 py-5">
            <TransporteurFormFields
              values={form}
              onChange={handleChange}
              errors={errors}
              step={step}
              autoFocusNom={!isEdit && step === 0}
            />
          </div>

          <DialogFooter className="flex-col gap-3 border-t border-border/60 px-6 py-4 bg-muted/40 sm:flex-row sm:justify-between">
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="text-muted-foreground">
                Annuler
              </Button>
              <span className="text-xs text-muted-foreground">
                {step + 1}/{TRANSPORTEUR_FORM_STEPS.length}
              </span>
            </div>

            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
                  <ChevronLeft className="size-4" />
                  Précédent
                </Button>
              )}
              {!isLastStep ? (
                <Button type="button" onClick={handleNext} disabled={!stepValid || saving}>
                  Suivant
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={!valid || saving}>
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : isEdit ? (
                    "Enregistrer les modifications"
                  ) : (
                    "Créer le transporteur"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
