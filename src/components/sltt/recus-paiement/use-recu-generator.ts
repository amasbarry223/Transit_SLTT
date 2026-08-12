"use client";

import { useCallback, useMemo, useState } from "react";
import type { RecuPaiementModuleData } from "@/lib/export";
import { printRecuPaiementModule } from "@/lib/export";
import { formatFCFA } from "@/lib/format";
import { computeReste, computeStatut } from "@/lib/recus-paiement";
import type { SocieteBrand } from "@/lib/societe-brand";
import { useStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
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

export const DEFAULT_FORM_STATE: RecuGeneratorFormState = {
  nom: "TRAORE",
  prenom: "Amadou",
  somme: "100000",
  motif: "Frais de prestation de transit",
  montantPaye: "70000",
  date: "2026-08-12",
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

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      toast({ title: error, variant: "destructive" });
      return;
    }
    if (!canWrite) {
      toast({ title: "Permission insuffisante", variant: "destructive" });
      return;
    }

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
      toast({
        title: "Reçu enregistré",
        description: `${saved.reference} — ${form.nom.trim()} ${form.prenom.trim()} (${formatFCFA(montantPaye)})`,
      });
    } catch (err) {
      toast({
        title: "Échec de l'enregistrement",
        description: getErrorMessage(err, "Réessayez."),
        variant: "destructive",
      });
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
    toast,
  ]);

  const handlePrint = useCallback(
    async (asPdf = false) => {
      if (!brand) {
        toast({
          title: "Aperçu indisponible",
          description: "Configurez la société transit dans Paramètres > Sociétés.",
          variant: "destructive",
        });
        return;
      }
      setPrinting(true);
      try {
        const ok = printRecuPaiementModule(moduleData, brand);
        if (!ok) {
          toast({
            title: asPdf ? "Export PDF impossible" : "Impression impossible",
            description: "Autorisez les fenêtres pop-up ou réessayez.",
            variant: "destructive",
          });
          return;
        }
        if (asPdf) {
          toast({
            title: "Enregistrer en PDF",
            description: `Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » — recu-${previewReference}.pdf`,
          });
        }
      } finally {
        setPrinting(false);
      }
    },
    [brand, moduleData, previewReference, toast],
  );

  const resetForm = useCallback(() => {
    setForm({ ...DEFAULT_FORM_STATE, signature: null });
  }, []);

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
    handleSave,
    handlePrint,
    handleDownloadPdf: () => void handlePrint(true),
    resetForm,
  };
}

export type RecuGeneratorBrand = SocieteBrand | null;
