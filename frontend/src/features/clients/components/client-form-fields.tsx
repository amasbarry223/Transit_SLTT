"use client";

import { Building2, User } from "lucide-react";
import type { ClientInput } from "@/features/clients/types";
import type { Annexe } from "@/lib/domain-types";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn";

const clientTypes: ClientInput["type"][] = ["Entreprise", "Particulier"];

export interface ClientFormErrors {
  nom?: string;
  email?: string;
  telephone?: string;
  annexeId?: string;
}

interface ClientFormFieldsProps {
  values: ClientInput;
  onChange: (patch: Partial<ClientInput>) => void;
  annexes: Annexe[];
  idPrefix?: string;
  autoFocusNom?: boolean;
  errors?: ClientFormErrors;
  touched?: Record<string, boolean>;
  onBlur?: (field: keyof ClientFormErrors) => void;
}

export function emptyClientForm(defaultAnnexeId = ""): ClientInput {
  return {
    nom: "",
    type: "Entreprise",
    telephone: "",
    email: "",
    adresse: "",
    annexeId: defaultAnnexeId,
  };
}

/** Champs partagés du formulaire client — validation au blur et retours visuels sous les champs. */
export function ClientFormFields({
  values,
  onChange,
  annexes,
  idPrefix = "cl",
  autoFocusNom,
  errors,
  touched,
  onBlur,
}: ClientFormFieldsProps) {
  const showNomError = (touched?.nom || errors?.nom) && errors?.nom;
  const showEmailError = (touched?.email || errors?.email) && errors?.email;
  const showTelError = (touched?.telephone || errors?.telephone) && errors?.telephone;
  const showAnnexeError = (touched?.annexeId || errors?.annexeId) && errors?.annexeId;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-nom`} className="text-sm font-medium text-foreground/90">
          Nom / Raison sociale <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${idPrefix}-nom`}
          value={values.nom ?? ""}
          onChange={(e) => onChange({ nom: e.target.value })}
          onBlur={() => onBlur?.("nom")}
          placeholder="Ex. Société ABC Logistique"
          className={cn("h-10", showNomError && "border-red-500 focus-visible:ring-red-500/30")}
          autoFocus={autoFocusNom}
        />
        {showNomError && (
          <p role="alert" className="text-xs text-red-500 font-medium">
            {errors?.nom}
          </p>
        )}
      </div>

      {annexes.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-annexe`} className="text-sm font-medium text-foreground/90">
            Annexe <span className="text-red-500">*</span>
          </Label>
          <Select
            value={values.annexeId || undefined}
            onValueChange={(v) => {
              onChange({ annexeId: v });
              onBlur?.("annexeId");
            }}
          >
            <SelectTrigger
              id={`${idPrefix}-annexe`}
              className={cn("h-10 w-full", showAnnexeError && "border-red-500")}
              aria-label="Sélectionner une annexe"
            >
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
          {showAnnexeError && (
            <p role="alert" className="text-xs text-red-500 font-medium">
              {errors?.annexeId}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground/90">Type de client</Label>
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
                    : "border-border bg-white bg-muted/40 text-muted-foreground hover:border-slate-300 hover:bg-slate-50",
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
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-tel`} className="text-sm font-medium text-foreground/90">
            Téléphone
          </Label>
          <Input
            id={`${idPrefix}-tel`}
            value={values.telephone ?? ""}
            onChange={(e) => onChange({ telephone: e.target.value })}
            onBlur={() => onBlur?.("telephone")}
            placeholder="Ex. +223 70 00 00 00"
            className={cn("h-10", showTelError && "border-red-500")}
          />
          {showTelError && (
            <p role="alert" className="text-xs text-red-500 font-medium">
              {errors?.telephone}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-email`} className="text-sm font-medium text-foreground/90">
            E-mail
          </Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={values.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
            onBlur={() => onBlur?.("email")}
            placeholder="Ex. contact@exemple.com"
            className={cn("h-10", showEmailError && "border-red-500")}
          />
          {showEmailError && (
            <p role="alert" className="text-xs text-red-500 font-medium">
              {errors?.email}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-adresse`} className="text-sm font-medium text-foreground/90">
          Adresse
        </Label>
        <Input
          id={`${idPrefix}-adresse`}
          value={values.adresse ?? ""}
          onChange={(e) => onChange({ adresse: e.target.value })}
          placeholder="Ex. Quartier, ville"
          className="h-10"
        />
      </div>
    </div>
  );
}
