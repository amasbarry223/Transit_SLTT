"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";

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
      setTarget(null);
    } catch (e) {
      toastError(toast, e, {
        title: errorTitle,
        fallback: errorFallbackMessage,
      });
      // Ne pas effacer `target` (le dialogue est généralement ouvert via
      // `open={!!target}`) et relancer : ConfirmDeleteDialog attend que
      // `onConfirm()` rejette pour garder la modale ouverte sur échec.
      // Sans ce rethrow, le dialogue se refermait systématiquement même
      // quand la suppression avait réellement échoué côté serveur.
      throw e;
    }
  }

  return { target, setTarget, confirm };
}
