"use client";

import { useCallback, useMemo, useState } from "react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import type { RecuPaiementModuleData } from "@/lib/export";
import { printRecuPaiementModule } from "@/lib/export";
import { useStore } from "@/lib/store";

import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { usePermission } from "@/shared/hooks/use-permission";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { resolveGeneratorBrand } from "./shared";

export interface GeneratedRecu {
  reference: string;
  moduleData: RecuPaiementModuleData;
}

/**
 * Un reçu se génère désormais VIERGE : plus de formulaire, seul le numéro
 * (RECU-0001…) est réservé côté serveur et pré-imprimé — le reste du carnet
 * (nom, motif, montants, date, signature) est rempli au stylo une fois
 * imprimé. Voir recus-paiement.service.ts::nextRecuReference.
 */
export function useRecuGenerator() {
  const { toast } = useToast();
  const canWrite = usePermission("recus-paiement:write");
  const { activeAnnexeId } = useActiveAnnexe();
  const societes = useStore((s) => s.societes);
  const annexes = useStore((s) => s.annexes);
  const addRecuPaiement = useStore((s) => s.addRecuPaiement);

  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [current, setCurrent] = useState<GeneratedRecu | null>(null);

  const brand = useMemo(
    () => resolveGeneratorBrand(societes, annexes, activeAnnexeId),
    [societes, annexes, activeAnnexeId],
  );

  const handleGenerate = useCallback(async (): Promise<GeneratedRecu | null> => {
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
      const saved = await addRecuPaiement({ annexeId: activeAnnexeId });
      const result: GeneratedRecu = {
        reference: saved.reference,
        moduleData: { reference: saved.reference },
      };
      setCurrent(result);
      toastSuccess(toast, { title: "Reçu généré", description: `${saved.reference} — prêt à imprimer.` });
      return result;
    } catch (err) {
      toastError(toast, err, { title: "Échec de la génération du reçu", fallback: "Réessayez." });
      return null;
    } finally {
      setGenerating(false);
    }
  }, [generating, canWrite, activeAnnexeId, addRecuPaiement, toast]);

  const handlePrint = useCallback(async (): Promise<boolean> => {
    if (!current) {
      toastWarning(toast, { title: "Générez d'abord un reçu avant de l'imprimer." });
      return false;
    }
    if (!brand) {
      toastWarning(toast, { title: "Aperçu indisponible", description: "Configurez l'entreprise dans Paramètres > Entreprise." });
      return false;
    }
    setPrinting(true);
    try {
      const ok = printRecuPaiementModule(current.moduleData, brand);
      if (!ok) {
        toastWarning(toast, { title: "Impression impossible", description: "Autorisez les fenêtres pop-up ou réessayez." });
        return false;
      }
      toastSuccess(toast, {
        title: "Enregistrer en PDF",
        description: `Format ${RECEIPT_FORMAT_LABEL} paysage uniquement. Choisissez « Enregistrer au format PDF » — vérifiez que le format papier n'est pas A4.`,
      });
      return true;
    } finally {
      setPrinting(false);
    }
  }, [current, brand, toast]);

  return {
    brand,
    canWrite,
    generating,
    printing,
    current,
    handleGenerate,
    handlePrint,
  };
}
