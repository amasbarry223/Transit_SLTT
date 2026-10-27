"use client";

import { Wallet } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SectionTitle } from "./dossier-form-ui";

type DossierAmountsSectionProps = {
  totalContrat: string;
  onTotalContratChange: (value: string) => void;
};

/** Section "Montants" : un seul champ, le total contrat facturé au client. */
export function DossierAmountsSection({ totalContrat, onTotalContratChange }: DossierAmountsSectionProps) {
  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <SectionTitle
        icon={<Wallet className="size-4" />}
        tone="emerald"
        title="Montants"
        description="Montant total facturé au client pour ce dossier"
      />
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor="dossier-total-contrat" className="text-sm font-medium text-foreground/90">
          Total contrat (FCFA)
        </Label>
        <div className="relative">
          <Input
            id="dossier-total-contrat"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            className="h-10 pr-14 text-right tabular-nums"
            value={totalContrat}
            onChange={(e) => onTotalContratChange(e.target.value)}
            placeholder="Ex. 12 000 000"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            FCFA
          </span>
        </div>
      </div>
    </Card>
  );
}
