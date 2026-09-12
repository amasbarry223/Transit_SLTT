"use client";

import { FilePlus2, Printer } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import { Button } from "@/shared/components/ui/button";

interface RecuGeneratorActionsProps {
  canWrite: boolean;
  hasCurrent: boolean;
  generating: boolean;
  printing: boolean;
  variant?: "default" | "toolbar";
  onGenerate: () => unknown;
  onPrint: () => unknown;
}

/** Deux actions seulement : réserver le prochain numéro, puis imprimer le
 *  carnet vierge — plus de formulaire à enregistrer ni à réinitialiser. */
export function RecuGeneratorActions({
  canWrite,
  hasCurrent,
  generating,
  printing,
  variant = "default",
  onGenerate,
  onPrint,
}: RecuGeneratorActionsProps) {
  const busy = generating || printing;

  if (variant === "toolbar") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {canWrite && (
          <Button
            size="sm"
            onClick={() => void onGenerate()}
            disabled={busy}
            className="h-9 gap-1.5 px-4 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-md shadow-red-600/25 border border-red-500/40 transition-all"
          >
            <FilePlus2 className="size-3.5" />
            {generating ? "Génération…" : "Générer un reçu"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => void onPrint()}
          disabled={busy || !hasCurrent}
          className="h-9 gap-1.5"
          title={`Impression ${RECEIPT_FORMAT_LABEL} paysage (pas A4)`}
        >
          <Printer className="size-3.5" />
          {printing ? "Préparation…" : "Imprimer"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Actions</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Générez un numéro de reçu vierge, puis imprimez-le ou enregistrez-le en PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {canWrite && (
          <Button
            onClick={() => void onGenerate()}
            disabled={busy}
            className="h-11 justify-center gap-2 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 transition-all"
          >
            <FilePlus2 className="size-4" />
            {generating ? "Génération…" : "Générer un nouveau reçu"}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => void onPrint()}
          disabled={busy || !hasCurrent}
          className="h-11 justify-center gap-2"
          title={`Impression ${RECEIPT_FORMAT_LABEL} paysage (pas A4)`}
        >
          <Printer className="size-4" />
          {printing ? "Préparation…" : "Imprimer / Enregistrer en PDF"}
        </Button>
      </div>
    </div>
  );
}
