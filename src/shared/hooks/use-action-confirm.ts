"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";

/**
 * Encapsule le triplet "cible sélectionnée → action → toast" pour les confirmations
 * non-destructives (voir ConfirmActionDialog).
 */
export function useActionConfirm<T>(
  action: (item: T) => Promise<void>,
  successTitle: string,
  errorTitle: string,
  errorFallbackMessage = UI.errors.generic,
) {
  const [target, setTarget] = useState<T | null>(null);
  const { toast } = useToast();

  async function confirm() {
    if (!target) return;
    try {
      await action(target);
      toastSuccess(toast, { title: successTitle });
    } catch (e) {
      toastError(toast, e, {
        title: errorTitle,
        fallback: errorFallbackMessage,
      });
    } finally {
      setTarget(null);
    }
  }

  return { target, setTarget, confirm };
}
