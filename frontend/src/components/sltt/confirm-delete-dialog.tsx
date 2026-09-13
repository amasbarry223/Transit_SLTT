"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

/**
 * Dialogue de confirmation de suppression standardisé :
 * - Intitulés explicites avec verbes d'action
 * - Conséquences affichées avant validation
 * - Boutons désactivés et spinner actif pendant l'opération
 * - Maintien du dialogue ouvert en cas d'échec serveur pour éviter toute confusion
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmLabel = "Oui, supprimer définitivement",
  cancelLabel = "Non, annuler",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** Conséquences à afficher explicitement avant confirmation (ex: "3 dépenses liées"). */
  consequences?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // En cas d'échec (toast levé par onConfirm), on ne ferme pas la modale
      // pour que l'utilisateur comprenne que l'opération n'a pas abouti.
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {consequences && consequences.length > 0 && (
          <ul className="list-disc space-y-1 rounded-md border border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            {consequences.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Suppression en cours…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
