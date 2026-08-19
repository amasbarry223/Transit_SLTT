"use client";

import { useState } from "react";
import { Printer, RotateCcw, Save } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
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
  variant?: "default" | "toolbar";
  onSave: () => void | Promise<void>;
  onPrint: () => void | Promise<void>;
  onReset: () => void;
}

export function RecuGeneratorActions({
  canWrite,
  submitting,
  printing,
  variant = "default",
  onSave,
  onPrint,
  onReset,
}: RecuGeneratorActionsProps) {
  const [resetOpen, setResetOpen] = useState(false);
  const busy = submitting || printing;

  if (variant === "toolbar") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          {canWrite ? (
            <Button size="sm" onClick={() => void onSave()} disabled={busy} className="h-9 gap-1.5 px-4">
              <Save className="size-3.5" />
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void onPrint()}
            disabled={busy}
            className="h-9 gap-1.5"
            title={`Impression ${RECEIPT_FORMAT_LABEL} paysage (pas A4)`}
          >
            <Printer className="size-3.5" />
            {printing ? "Préparation…" : "Imprimer"}
          </Button>
          <div className="ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setResetOpen(true)}
              disabled={busy}
              className="h-9 gap-1.5 text-slate-500"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
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

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Actions</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
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
          <Button
            variant="outline"
            onClick={() => void onPrint()}
            disabled={busy}
            className="h-11 justify-center gap-2 sm:col-span-2"
            title={`Impression ${RECEIPT_FORMAT_LABEL} paysage (pas A4)`}
          >
            <Printer className="size-4" />
            {printing ? "Préparation…" : "Imprimer"}
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
