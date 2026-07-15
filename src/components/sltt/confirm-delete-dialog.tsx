"use client";

import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Dialogue de confirmation de suppression partagé — standardise les 8 implémentations
 * divergentes (AlertDialog vs Dialog vs window.confirm, couleurs bg-red-600 vs
 * bg-destructive, absence de conséquences affichées) sur un seul composant.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmLabel = "Supprimer",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** Conséquences à afficher explicitement avant confirmation (ex: "3 dépenses liées"). */
  consequences?: string[];
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onOpenChange(false);
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
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {loading ? "Suppression…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
