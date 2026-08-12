"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Encapsule le triplet "cible sélectionnée → action → toast" pour les confirmations
 * non-destructives (voir ConfirmActionDialog).
 */
export function useActionConfirm<T>(
  action: (item: T) => Promise<void>,
  successTitle: string,
  errorFallbackMessage: string,
) {
  const [target, setTarget] = useState<T | null>(null);
  const { toast } = useToast();

  async function confirm() {
    if (!target) return;
    try {
      await action(target);
      toast({ title: successTitle });
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
