"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";

/**
 * Encapsule le triplet "cible sélectionnée → suppression → toast" répété sur
 * les écrans liste (voir ConfirmDeleteDialog pour le dialogue associé).
 */
export function useDeleteConfirm<T>(
  removeAction: (id: string) => Promise<void>,
  getId: (item: T) => string,
  getLabel: (item: T) => string | undefined,
  successTitle: string,
  errorTitle: string,
  errorFallbackMessage = UI.errors.generic,
) {
  const [target, setTarget] = useState<T | null>(null);
  const { toast } = useToast();

  async function confirm() {
    if (!target) return;
    try {
      await removeAction(getId(target));
      toastSuccess(toast, {
        title: successTitle,
        description: getLabel(target),
      });
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
