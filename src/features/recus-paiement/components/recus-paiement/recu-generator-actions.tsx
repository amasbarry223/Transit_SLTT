"use client";

import { FilePlus2, Printer } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface RecuGeneratorActionsProps {
  canWrite: boolean;
  hasCurrent: boolean;
  count: number;
  onCountChange: (value: number) => void;
  generating: boolean;
  printing: boolean;
  variant?: "default" | "toolbar";
  onGenerate: () => unknown;
  onPrint: () => unknown;
}

/** Deux actions : réserver le(s) prochain(s) numéro(s) (un champ précise
 *  combien), puis imprimer le carnet vierge — plus de formulaire à
 *  enregistrer ni à réinitialiser. */
export function RecuGeneratorActions({
  canWrite,
  hasCurrent,
  count,
  onCountChange,
  generating,
  printing,
  variant = "default",
  onGenerate,
  onPrint,
}: RecuGeneratorActionsProps) {
  const busy = generating || printing;
  const countInput = (
    <div className="flex items-center gap-1.5">
      <Label htmlFor="recu-count" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        Nombre
      </Label>
      <Input
        id="recu-count"
        type="number"
        min={1}
        max={100}
        value={count}
        onChange={(e) => onCountChange(Number(e.target.value))}
        disabled={busy}
        className="h-9 w-16 text-center"
      />
    </div>
  );

  if (variant === "toolbar") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {canWrite && (
          <>
            {countInput}
            <Button
              size="sm"
              onClick={() => void onGenerate()}
              disabled={busy}
              className="h-9 gap-1.5 px-4 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-md shadow-red-600/25 border border-red-500/40 transition-all"
            >
              <FilePlus2 className="size-3.5" />
              {generating ? "Génération…" : count > 1 ? `Générer ${count} reçus` : "Générer un reçu"}
            </Button>
          </>
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
          Générez un ou plusieurs numéros de reçu vierges, puis imprimez-les ou enregistrez-les en PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {canWrite && (
          <>
            {countInput}
            <Button
              onClick={() => void onGenerate()}
              disabled={busy}
              className="h-11 justify-center gap-2 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 transition-all"
            >
              <FilePlus2 className="size-4" />
              {generating ? "Génération…" : count > 1 ? `Générer ${count} reçus` : "Générer un nouveau reçu"}
            </Button>
          </>
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
