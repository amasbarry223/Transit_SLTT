"use client";

import { useCallback, useMemo, useState } from "react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import type { RecuPaiementModuleData } from "@/lib/export";
import { printRecuPaiementModule } from "@/lib/export";
import { computeReste, computeStatut } from "@/lib/recus-paiement";
import type { SocieteBrand } from "@/lib/societe-brand";
import { useStore } from "@/lib/store";

import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { formToModuleData, resolveGeneratorBrand } from "./shared";

export interface RecuGeneratorFormState {
  nom: string;
  prenom: string;
  somme: string;
  motif: string;
  montantPaye: string;
  date: string;
  signature: string | null;
}

export interface LastSavedRecu {
  reference: string;
  montantPaye: number;
  beneficiaire: string;
  moduleData: RecuPaiementModuleData;
}

export const DEFAULT_FORM_STATE: RecuGeneratorFormState = {
  nom: "",
  prenom: "",
  somme: "",
  motif: "Frais de prestation de transit",
  montantPaye: "",
  date: new Date().toISOString().slice(0, 10),
  signature: null,
};

function parseAmount(value: string): number {
  return Number(value.replace(/\s/g, "")) || 0;
}

function toIsoDate(dateInput: string): string {
  if (!dateInput) return new Date().toISOString();
  if (dateInput.includes("T")) return dateInput;
  return `${dateInput}T12:00:00.000Z`;
}

export function useRecuGenerator() {
  const { toast } = useToast();
  const canWrite = usePermission("recus-paiement:write");
  const { activeAnnexeId } = useActiveAnnexe();
  const societes = useStore((s) => s.societes);
  const annexes = useStore((s) => s.annexes);
  const recuPaiementSeq = useStore((s) => s.recuPaiementSeq);
  const addRecuPaiement = useStore((s) => s.addRecuPaiement);

  const [form, setForm] = useState<RecuGeneratorFormState>(DEFAULT_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [lastSaved, setLastSaved] = useState<LastSavedRecu | null>(null);

  const previewReference = useMemo(() => `RECU-${recuPaiementSeq}`, [recuPaiementSeq]);

  const brand = useMemo(
    () => resolveGeneratorBrand(societes, annexes, activeAnnexeId),
    [societes, annexes, activeAnnexeId],
  );

  const somme = useMemo(() => parseAmount(form.somme), [form.somme]);
  const montantPaye = useMemo(() => parseAmount(form.montantPaye), [form.montantPaye]);
  const reste = useMemo(() => computeReste(somme, montantPaye), [somme, montantPaye]);
  const statut = useMemo(() => computeStatut(somme, montantPaye), [somme, montantPaye]);
  const montantPayeDepasseSomme = montantPaye > somme;

  const moduleData: RecuPaiementModuleData = useMemo(
    () =>
      formToModuleData({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        motif: form.motif.trim(),
        somme,
        montantPaye,
        reste,
        date: toIsoDate(form.date),
        signature: form.signature ?? undefined,
      }),
    [form, somme, montantPaye, reste],
  );

  const updateField = useCallback(<K extends keyof RecuGeneratorFormState>(key: K, value: RecuGeneratorFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validate = useCallback((): string | null => {
    if (!form.nom.trim() || !form.prenom.trim()) return "Nom et prénom requis.";
    if (!form.motif.trim()) return "Motif requis.";
    if (somme <= 0) return "La somme doit être supérieure à 0.";
    if (montantPayeDepasseSomme) return "Le montant payé ne peut pas dépasser la somme.";
    if (!activeAnnexeId) return "Aucune annexe active — assignez une annexe à votre compte.";
    return null;
  }, [form.nom, form.prenom, form.motif, somme, montantPayeDepasseSomme, activeAnnexeId]);

  const printModuleData = useCallback(
    async (data: RecuPaiementModuleData, asPdf = false) => {
      if (!brand) {
        toastWarning(toast, { title: "Aperçu indisponible", description: "Configurez la société transit dans Paramètres > Sociétés." });
        return false;
      }
      setPrinting(true);
      try {
        const ok = printRecuPaiementModule(data, brand);
        if (!ok) {
          toastWarning(toast, {
            title: asPdf ? "Export PDF impossible" : "Impression impossible",
            description: "Autorisez les fenêtres pop-up ou réessayez.",
          });
          return false;
        }
        if (asPdf) {
          toastSuccess(toast, {
            title: "Enregistrer en PDF",
            description: `Format ${RECEIPT_FORMAT_LABEL} paysage uniquement. Choisissez « Enregistrer au format PDF » — vérifiez que le format papier n'est pas A4.`,
          });
        }
        return true;
      } finally {
        setPrinting(false);
      }
    },
    [brand, toast],
  );

  const resetForm = useCallback((opts?: { keepMotif?: boolean }) => {
    setForm({
      ...DEFAULT_FORM_STATE,
      motif: opts?.keepMotif ? form.motif : DEFAULT_FORM_STATE.motif,
      date: new Date().toISOString().slice(0, 10),
      signature: null,
    });
  }, [form.motif]);

  const handleSave = useCallback(async (): Promise<LastSavedRecu | null> => {
    const error = validate();
    if (error) {
      toastWarning(toast, { title: error });
      return null;
    }
    if (!canWrite) {
      toastWarning(toast, { title: "Permission insuffisante" });
      return null;
    }

    const savedModuleData = { ...moduleData };

    setSubmitting(true);
    try {
      const saved = await addRecuPaiement({
        annexeId: activeAnnexeId!,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        motif: form.motif.trim(),
        somme,
        montantPaye,
      });

      const beneficiaire = `${form.nom.trim()} ${form.prenom.trim()}`;
      const result: LastSavedRecu = {
        reference: saved.reference,
        montantPaye,
        beneficiaire,
        moduleData: savedModuleData,
      };
      setLastSaved(result);
      resetForm({ keepMotif: true });
      return result;
    } catch (err) {
      toastError(toast, err, { title: "Échec de l'enregistrement", fallback: "Réessayez." });
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    canWrite,
    addRecuPaiement,
    activeAnnexeId,
    form,
    somme,
    montantPaye,
    moduleData,
    toast,
    resetForm,
  ]);

  const handlePrint = useCallback(async () => {
    await printModuleData(moduleData, true);
  }, [moduleData, printModuleData]);

  const handlePrintLastSaved = useCallback(async () => {
    if (!lastSaved) return;
    await printModuleData(lastSaved.moduleData);
  }, [lastSaved, printModuleData]);

  return {
    form,
    updateField,
    setSignature: (signature: string | null) => updateField("signature", signature),
    previewReference,
    brand,
    somme,
    montantPaye,
    reste,
    statut,
    montantPayeDepasseSomme,
    moduleData,
    canWrite,
    submitting,
    printing,
    lastSaved,
    handleSave,
    handlePrint,
    handlePrintLastSaved,
    printModuleData,
    resetForm: () => resetForm(),
  };
}

export type RecuGeneratorBrand = SocieteBrand | null;
