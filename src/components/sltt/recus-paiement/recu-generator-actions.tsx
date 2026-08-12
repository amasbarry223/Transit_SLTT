"use client";

import { useState } from "react";
import { Download, Printer, RotateCcw, Save } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface RecuGeneratorActionsProps {
  canWrite: boolean;
  submitting: boolean;
  printing: boolean;
  onSave: () => void | Promise<void>;
  onPrint: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
  onReset: () => void;
}

export function RecuGeneratorActions({
  canWrite,
  submitting,
  printing,
  onSave,
  onPrint,
  onDownloadPdf,
  onReset,
}: RecuGeneratorActionsProps) {
  const [resetOpen, setResetOpen] = useState(false);
  const busy = submitting || printing;

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Actions</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Enregistrez, imprimez ou exportez le reçu une fois les informations complétées.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {canWrite ? (
            <Button onClick={() => void onSave()} disabled={busy} className="h-11 justify-center gap-2 sm:col-span-2">
              <Save className="size-4" />
              {submitting ? "Enregistrement…" : "Enregistrer le reçu"}
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => void onPrint()} disabled={busy} className="h-11 justify-center gap-2">
            <Printer className="size-4" />
            {printing ? "Préparation…" : "Imprimer"}
          </Button>
          <Button variant="outline" onClick={() => void onDownloadPdf()} disabled={busy} className="h-11 justify-center gap-2">
            <Download className="size-4" />
            Télécharger PDF
          </Button>
        </div>

        <Separator />

        <Button variant="ghost" onClick={() => setResetOpen(true)} disabled={busy} className="h-10 w-full justify-center gap-2 text-slate-500">
          <RotateCcw className="size-4" />
          Réinitialiser le formulaire
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le formulaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les informations saisies et la signature seront effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onReset();
                setResetOpen(false);
              }}
            >
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
