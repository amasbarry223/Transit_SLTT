"use client";

import { Building2, User } from "lucide-react";
import type { ClientInput } from "@/lib/store";
import type { Annexe } from "@/lib/domain-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const clientTypes: ClientInput["type"][] = ["Entreprise", "Particulier"];

interface ClientFormFieldsProps {
  values: ClientInput;
  onChange: (patch: Partial<ClientInput>) => void;
  annexes: Annexe[];
  idPrefix?: string;
  autoFocusNom?: boolean;
}

export function emptyClientForm(defaultAnnexeId = ""): ClientInput {
  return { nom: "", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: defaultAnnexeId };
}

/** Champs partagés du formulaire client — utilisés par l'annuaire et par la fiche client. */
export function ClientFormFields({ values, onChange, annexes, idPrefix = "cl", autoFocusNom }: ClientFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-nom`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nom / Raison sociale <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${idPrefix}-nom`}
          value={values.nom}
          onChange={(e) => onChange({ nom: e.target.value })}
          placeholder="Ex. Société ABC Logistique"
          className="h-10"
          autoFocus={autoFocusNom}
        />
      </div>

      {annexes.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-annexe`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Annexe <span className="text-red-500">*</span>
          </Label>
          <Select value={values.annexeId} onValueChange={(v) => onChange({ annexeId: v })}>
            <SelectTrigger id={`${idPrefix}-annexe`} className="h-10 w-full" aria-label="Sélectionner une annexe">
              <SelectValue placeholder="Sélectionner une annexe" />
            </SelectTrigger>
            <SelectContent>
              {annexes.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type de client</Label>
        <div className="grid grid-cols-2 gap-2">
          {clientTypes.map((t) => {
            const Icon = t === "Entreprise" ? Building2 : User;
            const selected = values.type === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ type: t })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <Icon className="size-5" />
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-tel`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Téléphone
          </Label>
          <Input
            id={`${idPrefix}-tel`}
            value={values.telephone}
            onChange={(e) => onChange({ telephone: e.target.value })}
            placeholder="Ex. +223 70 00 00 00"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            E-mail
          </Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="Ex. contact@exemple.com"
            className="h-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-adresse`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Adresse
        </Label>
        <Input
          id={`${idPrefix}-adresse`}
          value={values.adresse}
          onChange={(e) => onChange({ adresse: e.target.value })}
          placeholder="Ex. Quartier, ville"
          className="h-10"
        />
      </div>
    </div>
  );
}
