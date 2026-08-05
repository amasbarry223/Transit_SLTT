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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Confirmation renforcée pour les actions destructives à fort impact
 * (purge/restauration complète des données) — au-delà de ConfirmDeleteDialog :
 * le bouton ne s'active qu'après recopie exacte d'une phrase, pour empêcher
 * un double-clic ou une confirmation réflexe de déclencher l'action.
 */
export function DangerConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmPhrase,
  confirmLabel = "Confirmer",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  consequences?: string[];
  /** Phrase exacte à recopier pour activer le bouton de confirmation. */
  confirmPhrase: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);

  // Réinitialise la saisie à chaque ouverture/fermeture — pas d'effet : on
  // ajuste l'état pendant le rendu (pattern React officiel), pas après coup.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setTyped("");
  }

  const matches = typed.trim() === confirmPhrase;

  async function handleConfirm() {
    if (!matches || loading) return;
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
          <ul className="list-disc space-y-1 rounded-md border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {consequences.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="danger-confirm-input" className="text-sm">
            Tapez <span className="font-mono font-semibold">{confirmPhrase}</span> pour confirmer
          </Label>
          <Input
            id="danger-confirm-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={loading}
            autoComplete="off"
            autoFocus
            className="font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={!matches || loading}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "En cours…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
