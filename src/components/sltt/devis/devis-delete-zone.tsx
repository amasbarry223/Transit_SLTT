"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import type { Devis } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function DevisDeleteZone({ devis, onConfirm, onCancel }: {
  devis: Devis;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const handleDelete = onConfirm;
  const setConfirmDelete = (value: boolean) => !value && onCancel();
  return (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-6 text-red-700 dark:text-red-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-900 dark:text-red-200">Supprimer définitivement ce devis ?</h3>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300/80 leading-relaxed">
                Le devis <strong>{devis.reference}</strong> ({devis.clientNom} · {formatFCFA(devis.total)})
                sera supprimé de façon permanente et irréversible.
              </p>
              {devis.dossierId && (
                <p className="mt-2 text-sm font-medium text-red-900 dark:text-red-200 leading-relaxed">
                  ⚠ Ce devis est à l'origine du dossier associé — le dossier n'est pas supprimé, mais son devis d'origine disparaîtra de l'historique.
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <Button size="sm" variant="destructive" className="gap-2" onClick={handleDelete}>
                  <Trash2 className="size-4" /> Confirmer la suppression
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Annuler</Button>
              </div>
            </div>
          </div>
        </div>
  );
}
