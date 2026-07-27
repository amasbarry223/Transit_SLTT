"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentCategorie } from "@/lib/domain-types";

const CATEGORIES: DocumentCategorie[] = [
  "BL",
  "DAU",
  "Facture",
  "Reçu",
  "SYDONIA",
  "Contrat",
  "Autre",
];

export type DocumentMetaValues = {
  nom: string;
  categorie: DocumentCategorie;
};

export function DocumentMetaForm({
  values,
  onChange,
  disabled = false,
}: {
  values: DocumentMetaValues;
  onChange: (next: DocumentMetaValues) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="doc-nom">Nom du fichier</Label>
        <Input
          id="doc-nom"
          value={values.nom}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, nom: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="doc-categorie">Catégorie</Label>
        <Select
          value={values.categorie}
          disabled={disabled}
          onValueChange={(v) => onChange({ ...values, categorie: v as DocumentCategorie })}
        >
          <SelectTrigger id="doc-categorie">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
