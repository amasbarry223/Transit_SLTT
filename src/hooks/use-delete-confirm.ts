"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Encapsule le triplet "cible sélectionnée → suppression → toast" répété sur
 * les écrans liste (voir ConfirmDeleteDialog pour le dialogue associé).
 */
export function useDeleteConfirm<T>(
  removeAction: (id: string) => Promise<void>,
  getId: (item: T) => string,
  getLabel: (item: T) => string | undefined,
  successTitle: string,
  errorFallbackMessage: string,
) {
  const [target, setTarget] = useState<T | null>(null);
  const { toast } = useToast();

  async function confirm() {
    if (!target) return;
    try {
      await removeAction(getId(target));
      toast({ title: successTitle, description: getLabel(target) });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : errorFallbackMessage,
        variant: "destructive",
      });
    } finally {
      setTarget(null);
    }
  }

  return { target, setTarget, confirm };
}
