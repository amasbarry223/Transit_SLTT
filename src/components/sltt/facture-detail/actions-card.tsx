"use client";

import { CreditCard, FolderKanban, Pencil, Printer, XCircle } from "lucide-react";
import type { Dossier, Facture } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ActionsCard({
  facture,
  dossier,
  canEdit,
  canRecordPaiement,
  canWrite,
  onPrint,
  onStartEdit,
  onShowPaiement,
  onOpenDossier,
  onConfirmAnnuler,
}: {
  facture: Facture;
  dossier: Dossier | null | undefined;
  canEdit: boolean;
  canRecordPaiement: boolean;
  canWrite: boolean;
  onPrint: () => void;
  onStartEdit: () => void;
  onShowPaiement: () => void;
  onOpenDossier: (id: string) => void;
  onConfirmAnnuler: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Actions</h2>
      </div>
      <div className="space-y-2 p-4">
        <Button variant="outline" className="w-full justify-start gap-2.5 font-medium" onClick={onPrint}>
          <Printer className="size-4 text-slate-400" /> Télécharger PDF
        </Button>
        {canEdit && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 font-medium"
            onClick={onStartEdit}
          >
            <Pencil className="size-4 text-slate-400" /> Modifier la facture
          </Button>
        )}
        {canRecordPaiement && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/40"
            onClick={onShowPaiement}
          >
            <CreditCard className="size-4" /> Enregistrer un paiement
          </Button>
        )}
        {dossier && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 font-medium text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-indigo-950/40"
            onClick={() => onOpenDossier(dossier.id)}
          >
            <FolderKanban className="size-4" /> Voir le dossier lié
          </Button>
        )}
        {canWrite && facture.statut !== "Annulée" && facture.statut !== "Soldée" && (
          <>
            <Separator />
            <Button
              variant="outline"
              className="w-full justify-start gap-2.5 font-medium text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:bg-red-950/40"
              onClick={onConfirmAnnuler}
            >
              <XCircle className="size-4" /> Annuler la facture
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
