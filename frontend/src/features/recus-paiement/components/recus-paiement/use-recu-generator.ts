"use client";

import { useCallback, useMemo, useState } from "react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import type { RecuPaiementModuleData } from "@/lib/export";
import { printRecuPaiementBatch, printRecuPaiementTicket } from "@/lib/export";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session/session-store";
import { computeReste, computeStatut } from "@/lib/recus-paiement";
import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import type { RecuPaiementStatut } from "@/lib/domain-types";

import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { usePermission } from "@/shared/hooks/use-permission";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { resolveGeneratorBrand } from "./shared";

export type RecuMode = "saisie" | "vierge";

/** Pas de champ date : l'API ne persiste que createdAt, une date choisie
 *  ici serait imprimée sans jamais être enregistrée (papier et base
 *  divergeraient). Le reçu porte donc toujours la date de sa génération. */
export interface SaisieForm {
  nom: string;
  prenom: string;
  motif: string;
  somme: string;
  montantPaye: string;
}

export interface GeneratedRecu {
  reference: string;
  moduleData: RecuPaiementModuleData;
}

const DEFAULT_SAISIE_FORM: SaisieForm = {
  nom: "",
  prenom: "",
  motif: "Frais de prestation de transit",
  somme: "",
  montantPaye: "",
};

const MAX_BATCH_COUNT = 100;

function validateSaisie(form: SaisieForm, somme: number, montantPaye: number): string | null {
  if (!form.nom.trim() || !form.prenom.trim()) return "Le nom et le prénom sont obligatoires.";
  if (somme <= 0) return "La somme due doit être supérieure à 0.";
  if (montantPaye > somme) return "Le montant payé ne peut pas dépasser la somme due.";
  return null;
}

export function useRecuGenerator() {
  const { toast } = useToast();
  const canWrite = usePermission("recus-paiement:write");
  const { activeAnnexeId } = useActiveAnnexe();
  const societes = useStore((s) => s.societes);
  const annexes = useStore((s) => s.annexes);
  const addRecuPaiement = useStore((s) => s.addRecuPaiement);
  const currentUserName = useSession((s) => s.currentUserName);

  const [mode, setMode] = useState<RecuMode>("saisie");
  const [form, setForm] = useState<SaisieForm>(DEFAULT_SAISIE_FORM);
  const [savedRecu, setSavedRecu] = useState<GeneratedRecu | null>(null);

  // Mode carnet vierge
  const [batchCount, setBatchCount] = useState(1);
  const [batch, setBatch] = useState<GeneratedRecu[]>([]);

  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);

  const brand = useMemo(
    () => resolveGeneratorBrand(societes, annexes, activeAnnexeId),
    [societes, annexes, activeAnnexeId],
  );

  // Calculs dérivés pour la saisie directe
  const numSomme = useMemo(() => {
    const n = Number(form.somme);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [form.somme]);

  const numMontantPaye = useMemo(() => {
    const n = Number(form.montantPaye);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [form.montantPaye]);

  const reste = useMemo(() => computeReste(numSomme, numMontantPaye), [numSomme, numMontantPaye]);
  const statut: RecuPaiementStatut = useMemo(() => computeStatut(numSomme, numMontantPaye), [numSomme, numMontantPaye]);
  const sommeLettres = useMemo(() => (numSomme > 0 ? montantEnLettresFCFA(numSomme) : ""), [numSomme]);

  const updateFormField = useCallback((field: keyof SaisieForm, value: string) => {
    setForm((prev: SaisieForm) => ({ ...prev, [field]: value }));
  }, []);

  const updateBatchCount = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    setBatchCount(Math.min(MAX_BATCH_COUNT, Math.max(1, Math.round(value))));
  }, []);

  // Données du reçu en cours d'aperçu dynamique
  const activeModuleData: RecuPaiementModuleData = useMemo(() => {
    if (mode === "saisie") {
      return {
        reference: savedRecu ? savedRecu.reference : "RECU-XXXX",
        nom: form.nom.trim() || undefined,
        prenom: form.prenom.trim() || undefined,
        motif: form.motif.trim() || undefined,
        somme: numSomme > 0 ? numSomme : undefined,
        montantPaye: numMontantPaye > 0 ? numMontantPaye : undefined,
        reste: numSomme > 0 ? reste : undefined,
        date: savedRecu?.moduleData.date ?? new Date().toISOString(),
      };
    }
    // Mode carnet vierge
    if (batch.length > 0) {
      return batch[batch.length - 1].moduleData;
    }
    return { reference: "" };
  }, [mode, savedRecu, form, numSomme, numMontantPaye, reste, batch]);

  // Génération et enregistrement d'un reçu avec saisie
  const handleGenerateSaisie = useCallback(async (): Promise<GeneratedRecu | null> => {
    if (generating) return null;
    if (!canWrite) {
      toastWarning(toast, { title: "Permission insuffisante" });
      return null;
    }
    if (!activeAnnexeId) {
      toastWarning(toast, { title: "Aucune annexe active — assignez une annexe à votre compte." });
      return null;
    }
    // Chaque enregistrement consomme un numéro de la séquence RECU-xxxx :
    // un reçu vide ou incohérent ne doit jamais atteindre l'API.
    const invalid = validateSaisie(form, numSomme, numMontantPaye);
    if (invalid) {
      toastWarning(toast, { title: "Reçu incomplet", description: invalid });
      return null;
    }

    setGenerating(true);
    try {
      const saved = await addRecuPaiement({
        annexeId: activeAnnexeId,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        motif: form.motif.trim(),
        somme: numSomme,
        montantPaye: numMontantPaye,
      });

      const moduleData: RecuPaiementModuleData = {
        reference: saved.reference,
        nom: form.nom.trim() || undefined,
        prenom: form.prenom.trim() || undefined,
        motif: form.motif.trim() || undefined,
        somme: numSomme > 0 ? numSomme : undefined,
        montantPaye: numMontantPaye > 0 ? numMontantPaye : undefined,
        reste: numSomme > 0 ? reste : undefined,
        date: new Date().toISOString(),
      };

      const result: GeneratedRecu = { reference: saved.reference, moduleData };
      setSavedRecu(result);

      toastSuccess(toast, {
        title: `Reçu ${saved.reference} généré`,
        description: "Le reçu a été enregistré avec succès et est prêt à imprimer.",
      });
      return result;
    } catch (err) {
      toastError(toast, err, { title: "Échec de l'enregistrement", fallback: "Réessayez." });
      return null;
    } finally {
      setGenerating(false);
    }
  }, [generating, canWrite, activeAnnexeId, form, numSomme, numMontantPaye, reste, addRecuPaiement, toast]);

  // Impression du reçu en mode saisie
  const handlePrintSaisie = useCallback(async (): Promise<boolean> => {
    if (!brand) {
      toastWarning(toast, { title: "Aperçu indisponible", description: "Configurez l'entreprise dans Paramètres > Entreprise." });
      return false;
    }

    let recuToPrint = savedRecu;
    if (!recuToPrint) {
      // Auto-génération si pas encore validé
      recuToPrint = await handleGenerateSaisie();
      if (!recuToPrint) return false;
    }

    setPrinting(true);
    try {
      const ok = printRecuPaiementBatch([recuToPrint.moduleData], brand);
      if (!ok) {
        toastWarning(toast, { title: "Impression impossible", description: "Autorisez les fenêtres pop-up ou réessayez." });
        return false;
      }
      toastSuccess(toast, {
        title: "Impression du reçu",
        description: `Format ${RECEIPT_FORMAT_LABEL} paysage envoyé à l'impression.`,
      });
      return true;
    } finally {
      setPrinting(false);
    }
  }, [brand, savedRecu, handleGenerateSaisie, toast]);

  // Impression ticket de caisse 80 mm (imprimante thermique) — même logique
  // d'auto-enregistrement que l'impression carnet.
  const handlePrintTicket = useCallback(async (): Promise<boolean> => {
    if (!brand) {
      toastWarning(toast, { title: "Aperçu indisponible", description: "Configurez l'entreprise dans Paramètres > Entreprise." });
      return false;
    }
    let recuToPrint = savedRecu;
    if (!recuToPrint) {
      recuToPrint = await handleGenerateSaisie();
      if (!recuToPrint) return false;
    }

    const data = recuToPrint.moduleData;
    setPrinting(true);
    try {
      const ok = await printRecuPaiementTicket(
        {
          ...data,
          statut: computeStatut(data.somme ?? 0, data.montantPaye ?? 0),
          encaissePar: currentUserName || undefined,
        },
        brand,
      );
      if (!ok) {
        toastWarning(toast, { title: "Impression impossible", description: "Autorisez les fenêtres pop-up ou réessayez." });
        return false;
      }
      toastSuccess(toast, {
        title: "Ticket de caisse",
        description: "Choisissez l'imprimante ticket (80 mm) dans la fenêtre d'impression.",
      });
      return true;
    } finally {
      setPrinting(false);
    }
  }, [brand, savedRecu, handleGenerateSaisie, currentUserName, toast]);

  // Réinitialiser pour un nouveau reçu
  const handleResetSaisie = useCallback(() => {
    setForm(DEFAULT_SAISIE_FORM);
    setSavedRecu(null);
  }, []);

  // Génération d'un lot de numéros vierges (carnet)
  const handleGenerateBatch = useCallback(async (): Promise<GeneratedRecu[] | null> => {
    if (generating) return null;
    if (!canWrite) {
      toastWarning(toast, { title: "Permission insuffisante" });
      return null;
    }
    if (!activeAnnexeId) {
      toastWarning(toast, { title: "Aucune annexe active — assignez une annexe à votre compte." });
      return null;
    }
    setGenerating(true);
    try {
      const results: GeneratedRecu[] = [];
      for (let i = 0; i < batchCount; i++) {
        const saved = await addRecuPaiement({ annexeId: activeAnnexeId });
        results.push({ reference: saved.reference, moduleData: { reference: saved.reference } });
      }
      setBatch(results);
      toastSuccess(toast, {
        title: results.length > 1 ? `${results.length} reçus générés` : "Reçu généré",
        description:
          results.length > 1
            ? `${results[0].reference} → ${results[results.length - 1].reference} — prêts à imprimer.`
            : `${results[0].reference} — prêt à imprimer.`,
      });
      return results;
    } catch (err) {
      toastError(toast, err, { title: "Échec de la génération du carnet", fallback: "Réessayez." });
      return null;
    } finally {
      setGenerating(false);
    }
  }, [generating, canWrite, activeAnnexeId, addRecuPaiement, batchCount, toast]);

  // Impression du lot vierge
  const handlePrintBatch = useCallback(async (): Promise<boolean> => {
    if (batch.length === 0) {
      toastWarning(toast, { title: "Générez d'abord un reçu avant de l'imprimer." });
      return false;
    }
    if (!brand) {
      toastWarning(toast, { title: "Aperçu indisponible", description: "Configurez l'entreprise dans Paramètres > Entreprise." });
      return false;
    }
    setPrinting(true);
    try {
      const ok = printRecuPaiementBatch(batch.map((r: GeneratedRecu) => r.moduleData), brand);
      if (!ok) {
        toastWarning(toast, { title: "Impression impossible", description: "Autorisez les fenêtres pop-up ou réessayez." });
        return false;
      }
      toastSuccess(toast, {
        title: "Enregistrer en PDF",
        description: `Format ${RECEIPT_FORMAT_LABEL} paysage (une page par reçu).`,
      });
      return true;
    } finally {
      setPrinting(false);
    }
  }, [batch, brand, toast]);

  return {
    mode,
    setMode,
    brand,
    canWrite,
    // Saisie directe
    form,
    updateFormField,
    savedRecu,
    numSomme,
    numMontantPaye,
    reste,
    statut,
    sommeLettres,
    handleGenerateSaisie,
    handlePrintSaisie,
    handlePrintTicket,
    handleResetSaisie,
    // Carnet vierge
    batchCount,
    setBatchCount: updateBatchCount,
    batchSize: batch.length,
    currentVierge: batch.length > 0 ? batch[batch.length - 1] : null,
    handleGenerateBatch,
    handlePrintBatch,
    // Vue courante
    activeModuleData,
    generating,
    printing,
  };
}

export type RecuGeneratorBrand = ReturnType<typeof resolveGeneratorBrand>;
