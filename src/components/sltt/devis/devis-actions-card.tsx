"use client";

import { FileCheck2, Pencil, Printer, Trash2 } from "lucide-react";
import type { Devis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function DevisActionsCard({
  devis, canWrite, canEditContent, onPrint, onEdit, onOpenDossier, onConvert, onDelete,
}: {
  devis: Devis;
  canWrite: boolean;
  canEditContent: boolean;
  onPrint: () => void;
  onEdit: () => void;
  onOpenDossier: (id: string) => void;
  onConvert: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <div className="border-b border-border/60 px-5 py-3 bg-muted/60">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Actions</h2>
      </div>
      <div className="space-y-2 p-4">
        <Button variant="outline" className="w-full justify-start gap-2.5 font-medium" onClick={onPrint}>
          <Printer className="size-4 text-muted-foreground" /> Télécharger PDF
        </Button>
        {canEditContent && (
          <Button variant="outline" className="w-full justify-start gap-2.5 font-medium" onClick={onEdit}>
            <Pencil className="size-4 text-muted-foreground" /> Modifier le devis
          </Button>
        )}
        {devis.dossierId ? (
          <Button variant="outline"
            className="w-full justify-start gap-2.5 border-emerald-200 font-medium text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
            onClick={() => onOpenDossier(devis.dossierId!)}>
            <FileCheck2 className="size-4" /> Voir le dossier
          </Button>
        ) : canWrite && devis.statut === "Accepté" ? (
          <Button variant="outline"
            className="w-full justify-start gap-2.5 border-emerald-200 font-medium text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
            onClick={onConvert}>
            <FileCheck2 className="size-4" /> Convertir en dossier
          </Button>
        ) : null}
        {canWrite && (
          <>
            <Separator />
            <Button variant="outline"
              className="w-full justify-start gap-2.5 border-red-200 font-medium text-red-600 hover:bg-red-50 dark:bg-red-950/40 dark:text-red-400"
              onClick={onDelete}>
              <Trash2 className="size-4" /> Supprimer
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
