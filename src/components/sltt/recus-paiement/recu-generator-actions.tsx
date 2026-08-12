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
      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <Button onClick={() => void onSave()} disabled={busy}>
            <Save className="size-4" />
            Enregistrer
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => void onPrint()} disabled={busy}>
          <Printer className="size-4" />
          Imprimer
        </Button>
        <Button variant="outline" onClick={() => void onDownloadPdf()} disabled={busy}>
          <Download className="size-4" />
          Télécharger PDF
        </Button>
        <Button variant="ghost" onClick={() => setResetOpen(true)} disabled={busy}>
          <RotateCcw className="size-4" />
          Réinitialiser
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le formulaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les informations saisies et la signature seront effacées et remplacées par les valeurs de test par défaut.
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
