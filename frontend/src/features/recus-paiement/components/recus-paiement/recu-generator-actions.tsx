"use client";

import { FilePlus2, Minus, Plus, Printer } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";

interface RecuGeneratorActionsProps {
  canWrite: boolean;
  hasCurrent: boolean;
  count: number;
  onCountChange: (value: number) => void;
  generating: boolean;
  printing: boolean;
  variant?: "default" | "sidebar";
  onGenerate: () => unknown;
  onPrint: () => unknown;
}

/** Stepper -/valeur/+ — plus tactile et lisible qu'un simple champ nombre
 *  pour une valeur bornée [1, 100] qu'on ajuste surtout de 1 en 1. */
function QuantityStepper({
  count,
  onCountChange,
  disabled,
  className,
}: {
  count: number;
  onCountChange: (value: number) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onCountChange(count - 1)}
        disabled={disabled || count <= 1}
        aria-label="Diminuer le nombre de reçus"
      >
        <Minus className="size-3.5" />
      </Button>
      <Input
        id="recu-count"
        type="number"
        min={1}
        max={100}
        value={count}
        onChange={(e) => onCountChange(Number(e.target.value))}
        disabled={disabled}
        className="h-8.5 w-14 text-center font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onCountChange(count + 1)}
        disabled={disabled || count >= 100}
        aria-label="Augmenter le nombre de reçus"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

/** Deux actions : réserver le(s) prochain(s) numéro(s) (un stepper précise
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

  if (variant === "sidebar") {
    return (
      <div className="flex flex-col gap-5">
        {canWrite && (
          <div className="space-y-2">
            <Label htmlFor="recu-count" className="text-xs font-medium text-muted-foreground">
              Nombre de reçus à réserver
            </Label>
            <QuantityStepper count={count} onCountChange={onCountChange} disabled={busy} />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Plusieurs numéros d&apos;affilée pour un carnet à découper.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {canWrite && (
            <Button
              onClick={() => void onGenerate()}
              disabled={busy}
              className="h-11 justify-center gap-2 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 transition-all"
            >
              <FilePlus2 className="size-4" />
              {generating ? "Génération…" : count > 1 ? `Générer ${count} reçus` : "Générer un reçu"}
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
            {printing ? "Préparation…" : "Imprimer"}
          </Button>
        </div>
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

      <div className="grid grid-cols-1 gap-3">
        {canWrite && (
          <>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
              <Label htmlFor="recu-count" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Nombre de reçus
              </Label>
              <QuantityStepper count={count} onCountChange={onCountChange} disabled={busy} />
            </div>
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
