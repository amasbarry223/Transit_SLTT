"use client";

import { AlertTriangle, Banknote, Plus, Trash2 } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import {
  MODES_PAIEMENT,
  MODE_PAIEMENT_LABELS,
  type ModePaiementDossier,
} from "@/lib/domain/dossier-finances";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { SectionTitle } from "./dossier-form-ui";
import type { PaiementForm } from "./use-dossier-form-state";

type DossierPaiementsSectionProps = {
  paiements: PaiementForm[];
  montantPaye: number;
  totalContrat: number;
  onChange: (key: string, patch: Partial<PaiementForm>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
};

/** "Paiements du client" : Date | Montant | Mode | Réf., édition en ligne, total en bas. */
export function DossierPaiementsSection({
  paiements,
  montantPaye,
  totalContrat,
  onChange,
  onAdd,
  onRemove,
}: DossierPaiementsSectionProps) {
  const depassement = montantPaye - totalContrat;

  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <SectionTitle
        icon={<Banknote className="size-4" />}
        tone="emerald"
        title="Paiements du client"
        description="Chaque versement reçu du client sur ce dossier"
      />

      <div className="hidden grid-cols-12 gap-2 px-1 pb-1 text-xs font-medium text-muted-foreground sm:grid">
        <span className="col-span-3">Date</span>
        <span className="col-span-3 text-right">Montant</span>
        <span className="col-span-2">Mode</span>
        <span className="col-span-3">Réf.</span>
      </div>

      {paiements.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Aucun paiement enregistré.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {paiements.map((p) => (
            <div
              key={p.key}
              className="grid grid-cols-2 gap-2 rounded-md border border-border/80 p-2 sm:grid-cols-12 sm:items-center sm:border-0 sm:p-0"
            >
              <Input
                aria-label="Date du paiement"
                type="date"
                className="h-9 sm:col-span-3"
                value={p.date}
                onChange={(e) => onChange(p.key, { date: e.target.value })}
              />
              <Input
                aria-label="Montant reçu"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className="h-9 text-right tabular-nums sm:col-span-3"
                value={p.montant}
                onChange={(e) => onChange(p.key, { montant: e.target.value })}
                placeholder="Montant"
              />
              <Select
                value={p.mode}
                onValueChange={(v) => onChange(p.key, { mode: v as ModePaiementDossier })}
              >
                <SelectTrigger aria-label="Mode de paiement" className="h-9 w-full sm:col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES_PAIEMENT.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_PAIEMENT_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label="Référence"
                className="h-9 sm:col-span-3"
                value={p.reference}
                onChange={(e) => onChange(p.key, { reference: e.target.value })}
                placeholder="Optionnel"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 justify-self-end text-muted-foreground hover:text-red-600 sm:col-span-1"
                onClick={() => onRemove(p.key)}
                aria-label="Supprimer le paiement"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          Ajouter un paiement
        </Button>
        <div className="text-sm">
          <span className="text-muted-foreground">Total payé : </span>
          <span className="font-semibold tabular-nums">{formatFCFA(montantPaye)}</span>
        </div>
      </div>

      {depassement > 0 && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Le cumul des paiements dépasse le total contrat de {formatFCFA(depassement)} (trop-perçu).
          </span>
        </div>
      )}
    </Card>
  );
}
