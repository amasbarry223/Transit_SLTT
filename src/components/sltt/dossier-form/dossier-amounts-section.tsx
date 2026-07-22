"use client";

import { Info, Wallet } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./dossier-form-ui";

type DossierAmountsSectionProps = {
  droitDouane: string;
  fraisCircuit: string;
  fraisPrestation: string;
  onDroitDouaneChange: (value: string) => void;
  onFraisCircuitChange: (value: string) => void;
  onFraisPrestationChange: (value: string) => void;
  montantInvesti: number;
  ecart: number;
};

export function DossierAmountsSection({
  droitDouane,
  fraisCircuit,
  fraisPrestation,
  onDroitDouaneChange,
  onFraisCircuitChange,
  onFraisPrestationChange,
  montantInvesti,
  ecart,
}: DossierAmountsSectionProps) {
  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <SectionTitle
        icon={<Wallet className="size-4" />}
        tone="emerald"
        title="Montants (FCFA)"
        description="Saisissez les montants — la marge est calculée automatiquement"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AmountField
          label="Droit de douane"
          value={droitDouane}
          onChange={onDroitDouaneChange}
          hint="Taxe versée à la douane pour dédouaner la marchandise."
        />
        <AmountField
          label="Frais de circuit global"
          value={fraisCircuit}
          onChange={onFraisCircuitChange}
          hint="Frais de transit (manutention, transport local, formalités) hors droit de douane."
        />
        <AmountField
          label="Frais de prestation"
          value={fraisPrestation}
          onChange={onFraisPrestationChange}
          hint="Rémunération de SLTT pour le service de transit — c'est elle qui détermine la marge du dossier."
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Montant investi (calculé)
          </label>
          <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-100 px-3 tabular-nums text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {formatFCFA(montantInvesti)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Droit de douane + Frais de circuit + Frais de prestation
          </p>
        </div>

        <div className="sm:col-span-2">
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
              ecart >= 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                : "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40",
            )}
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                Marge calculée automatiquement
              </div>
              <div className="mt-0.5 text-xs opacity-70">
                Prestation − (Droit de douane + Frais de circuit)
              </div>
            </div>
            <div className="whitespace-nowrap text-xl font-bold tabular-nums">
              {ecart >= 0 ? "+" : ""}
              {formatFCFA(ecart)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AmountField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <Info className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {hint}
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          className="h-10 pr-14 text-right tabular-nums"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
          FCFA
        </span>
      </div>
    </div>
  );
}
