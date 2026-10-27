"use client";

import { Plus, Receipt, Trash2 } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import {
  CATEGORIES_DEPENSE,
  CATEGORIE_DEPENSE_LABELS,
  type CategorieDepense,
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
import type { DepenseForm } from "./use-dossier-form-state";

type DossierDepensesSectionProps = {
  depenses: DepenseForm[];
  totalDepenses: number;
  onChange: (key: string, patch: Partial<DepenseForm>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
};

/** "Dépenses" : Date | Nature | Catégorie | Montant, édition en ligne, total en bas. */
export function DossierDepensesSection({
  depenses,
  totalDepenses,
  onChange,
  onAdd,
  onRemove,
}: DossierDepensesSectionProps) {
  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <SectionTitle
        icon={<Receipt className="size-4" />}
        tone="amber"
        title="Dépenses"
        description="Tout ce qui a été dépensé pour ce dossier, droit de douane compris"
      />

      <div className="hidden grid-cols-12 gap-2 px-1 pb-1 text-xs font-medium text-muted-foreground sm:grid">
        <span className="col-span-3">Date</span>
        <span className="col-span-4">Nature</span>
        <span className="col-span-2">Catégorie</span>
        <span className="col-span-2 text-right">Montant</span>
      </div>

      {depenses.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Aucune dépense enregistrée.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {depenses.map((d) => (
            <div
              key={d.key}
              className="grid grid-cols-2 gap-2 rounded-md border border-border/80 p-2 sm:grid-cols-12 sm:items-center sm:border-0 sm:p-0"
            >
              <Input
                aria-label="Date de la dépense"
                type="date"
                className="h-9 sm:col-span-3"
                value={d.date}
                onChange={(e) => onChange(d.key, { date: e.target.value })}
              />
              <Input
                aria-label="Nature"
                className="h-9 sm:col-span-4"
                value={d.nature}
                onChange={(e) => onChange(d.key, { nature: e.target.value })}
                placeholder="Ex. Droit de douane"
              />
              <Select
                value={d.categorie}
                onValueChange={(v) => onChange(d.key, { categorie: v as CategorieDepense })}
              >
                <SelectTrigger aria-label="Catégorie" className="h-9 w-full sm:col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_DEPENSE.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORIE_DEPENSE_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label="Montant"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className="h-9 text-right tabular-nums sm:col-span-2"
                value={d.montant}
                onChange={(e) => onChange(d.key, { montant: e.target.value })}
                placeholder="Montant"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 justify-self-end text-muted-foreground hover:text-red-600 sm:col-span-1"
                onClick={() => onRemove(d.key)}
                aria-label="Supprimer la dépense"
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
          Ajouter une dépense
        </Button>
        <div className="text-sm">
          <span className="text-muted-foreground">Total dépenses : </span>
          <span className="font-semibold tabular-nums">{formatFCFA(totalDepenses)}</span>
        </div>
      </div>
    </Card>
  );
}
