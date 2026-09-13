"use client";

import { useState } from "react";
import { Truck, Check, Loader2 } from "lucide-react";
import { useStore, type Transporteur, type TransporteurInput } from "@/lib/store";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import {
  TransporteurFormFields,
  emptyTransporteurForm,
  validateTransporteurForm,
} from "@/components/sltt/transporteur-form-fields";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

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

  const [form, setForm] = useState<TransporteurInput>(emptyTransporteurForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TransporteurInput, string>>>({});
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

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
      setShowErrors(false);
      setSaving(false);
    }
  }

  const handleChange = (patch: Partial<TransporteurInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    if (showErrors) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(patch) as (keyof TransporteurInput)[]) {
          delete next[key];
        }
        return next;
      });
    }
  };

  // Le dialog Radix reste monté et cliquable ~200ms pendant son animation de
  // fermeture. Si `saving` repassait à false dans un `finally` après un
  // succès, un second clic pendant cette fenêtre resoumettait le MÊME
  // formulaire (pas encore réinitialisé) et créait un vrai transporteur en
  // double. On ne réarme donc `saving` que sur la branche d'échec.
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    const nextErrors = validateTransporteurForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setShowErrors(true);
      // Amène le 1er champ en erreur dans le viewport.
      const firstKey = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => {
        document.getElementById(`tr-${firstKey === "telephone" ? "tel" : firstKey === "immatriculation" ? "immat" : firstKey}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
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
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 space-y-0 border-b border-border/60 px-6 py-4 text-left">
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
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {target.vehicule}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{target.immatriculation}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <TransporteurFormFields
              values={form}
              onChange={handleChange}
              errors={showErrors ? errors : {}}
              autoFocusNom={!isEdit}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-muted/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="text-muted-foreground">
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  {isEdit ? "Enregistrer les modifications" : "Créer le transporteur"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
