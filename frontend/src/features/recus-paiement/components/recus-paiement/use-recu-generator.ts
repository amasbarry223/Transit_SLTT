"use client";

import { useCallback, useMemo, useState } from "react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import type { RecuPaiementModuleData } from "@/lib/export";
import { printRecuPaiementBatch } from "@/lib/export";
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

/** Un clic imprime un carnet entier, une génération par centaine serait
 *  un abus manifeste (erreur de saisie) plutôt qu'un besoin réel. */
const MAX_BATCH_COUNT = 100;

/**
 * Un reçu se génère désormais VIERGE : plus de formulaire, seul le numéro
 * (RECU-0001…) est réservé côté serveur et pré-imprimé — le reste du carnet
 * (nom, motif, montants, date, signature) est rempli au stylo une fois
 * imprimé. Un même clic peut réserver et imprimer PLUSIEURS numéros
 * d'affilée (carnet à découper). Voir recus-paiement.service.ts::nextRecuReference.
 */
export function useRecuGenerator() {
  const { toast } = useToast();
  const canWrite = usePermission("recus-paiement:write");
  const { activeAnnexeId } = useActiveAnnexe();
  const societes = useStore((s) => s.societes);
  const annexes = useStore((s) => s.annexes);
  const addRecuPaiement = useStore((s) => s.addRecuPaiement);

  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [batch, setBatch] = useState<GeneratedRecu[]>([]);

  const brand = useMemo(
    () => resolveGeneratorBrand(societes, annexes, activeAnnexeId),
    [societes, annexes, activeAnnexeId],
  );

  /** Le dernier reçu généré du lot — sert d'aperçu représentatif (tous les
   *  reçus d'un même lot sont identiques hormis leur numéro). */
  const current = batch.length > 0 ? batch[batch.length - 1] : null;

  const updateCount = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    setCount(Math.min(MAX_BATCH_COUNT, Math.max(1, Math.round(value))));
  }, []);

  const handleGenerate = useCallback(async (): Promise<GeneratedRecu[] | null> => {
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
      // Séquentiel, pas Promise.all : chaque réservation de numéro dépend de
      // l'état déjà persisté par la précédente (nextRecuReference() lit le
      // dernier RECU- en base) — des appels parallèles multiplieraient les
      // collisions et les retries côté serveur pour rien.
      for (let i = 0; i < count; i++) {
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
      toastError(toast, err, { title: "Échec de la génération du reçu", fallback: "Réessayez." });
      return null;
    } finally {
      setGenerating(false);
    }
  }, [generating, canWrite, activeAnnexeId, addRecuPaiement, count, toast]);

  const handlePrint = useCallback(async (): Promise<boolean> => {
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
      const ok = printRecuPaiementBatch(batch.map((r) => r.moduleData), brand);
      if (!ok) {
        toastWarning(toast, { title: "Impression impossible", description: "Autorisez les fenêtres pop-up ou réessayez." });
        return false;
      }
      toastSuccess(toast, {
        title: "Enregistrer en PDF",
        description: `Format ${RECEIPT_FORMAT_LABEL} paysage uniquement (une page par reçu). Choisissez « Enregistrer au format PDF » — vérifiez que le format papier n'est pas A4.`,
      });
      return true;
    } finally {
      setPrinting(false);
    }
  }, [batch, brand, toast]);

  return {
    brand,
    canWrite,
    count,
    setCount: updateCount,
    generating,
    printing,
    current,
    batchSize: batch.length,
    handleGenerate,
    handlePrint,
  };
}
