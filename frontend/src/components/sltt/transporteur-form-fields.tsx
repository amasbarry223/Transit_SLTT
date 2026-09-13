"use client";

import { useState } from "react";
import { Phone, User, Mail, ChevronDown } from "lucide-react";
import type { TransporteurInput, TypeVehicule } from "@/lib/store";
import { FormField } from "@/components/sltt/form-field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn";

export const VEHICULES: TypeVehicule[] = [
  "Camion",
  "Remorque",
  "Semi-remorque",
  "Benne",
  "Fourgon",
];

export function emptyTransporteurForm(): TransporteurInput {
  return {
    nom: "",
    contact: "",
    telephone: "",
    email: "",
    vehicule: "Camion",
    immatriculation: "",
    trajet: "",
    capacite: 0,
    statut: "Actif",
    notes: "",
  };
}

interface TransporteurFormFieldsProps {
  values: TransporteurInput;
  onChange: (patch: Partial<TransporteurInput>) => void;
  errors?: Partial<Record<keyof TransporteurInput, string>>;
  idPrefix?: string;
  autoFocusNom?: boolean;
}

export function TransporteurFormFields({
  values,
  onChange,
  errors = {},
  idPrefix = "tr",
  autoFocusNom,
}: TransporteurFormFieldsProps) {
  const hasDetails = Boolean(
    values.contact || values.email || values.immatriculation || values.capacite || values.notes,
  );
  const [showDetails, setShowDetails] = useState(hasDetails);
  const errCls = (k: keyof TransporteurInput) =>
    errors[k] ? "border-red-400 focus-visible:ring-red-400" : "";

  return (
    <div className="space-y-4">
      {/* ── L'essentiel ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={`${idPrefix}-nom`} label="Nom du transporteur" required error={errors.nom}>
          <Input
            id={`${idPrefix}-nom`}
            value={values.nom}
            onChange={(e) => onChange({ nom: e.target.value })}
            placeholder="Ex. Transport Express SARL"
            className={cn("h-10", errCls("nom"))}
            autoFocus={autoFocusNom}
          />
        </FormField>

        <FormField id={`${idPrefix}-tel`} label="Téléphone" required error={errors.telephone}>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${idPrefix}-tel`}
              type="tel"
              value={values.telephone}
              onChange={(e) => onChange({ telephone: e.target.value })}
              placeholder="+223 70 00 00 00"
              className={cn("h-10 pl-9", errCls("telephone"))}
            />
          </div>
        </FormField>

        <FormField id={`${idPrefix}-vehicule`} label="Type de véhicule">
          <Select
            value={values.vehicule}
            onValueChange={(v) => onChange({ vehicule: v as TypeVehicule })}
          >
            <SelectTrigger id={`${idPrefix}-vehicule`} className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEHICULES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField id={`${idPrefix}-trajet`} label="Trajet habituel">
          <Input
            id={`${idPrefix}-trajet`}
            value={values.trajet}
            onChange={(e) => onChange({ trajet: e.target.value })}
            placeholder="Ex. Bamako – Dakar"
            className="h-10"
          />
        </FormField>
      </div>

      {/* ── Détails facultatifs, repliés par défaut ── */}
      <div className="rounded-xl border border-border/70">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium text-foreground/90 hover:bg-muted/50"
        >
          Ajouter des détails
          <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            contact, e-mail, immatriculation…
            <ChevronDown className={cn("size-4 transition-transform", showDetails && "rotate-180")} />
          </span>
        </button>

        {showDetails && (
          <div className="space-y-4 border-t border-border/70 px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id={`${idPrefix}-contact`} label="Personne de contact">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`${idPrefix}-contact`}
                    value={values.contact}
                    onChange={(e) => onChange({ contact: e.target.value })}
                    placeholder="Prénom Nom"
                    className="h-10 pl-9"
                  />
                </div>
              </FormField>

              <FormField id={`${idPrefix}-email`} label="E-mail">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`${idPrefix}-email`}
                    type="email"
                    value={values.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    placeholder="contact@exemple.com"
                    className="h-10 pl-9"
                  />
                </div>
              </FormField>

              <FormField id={`${idPrefix}-immat`} label="Immatriculation">
                <Input
                  id={`${idPrefix}-immat`}
                  value={values.immatriculation}
                  onChange={(e) => onChange({ immatriculation: e.target.value.toUpperCase() })}
                  placeholder="AB-1234-ML"
                  className="h-10 font-mono uppercase tracking-wide"
                />
              </FormField>

              <FormField id={`${idPrefix}-capacite`} label="Capacité (tonnes)">
                <Input
                  id={`${idPrefix}-capacite`}
                  type="number"
                  min={0}
                  max={80}
                  value={values.capacite || ""}
                  onChange={(e) => onChange({ capacite: Number(e.target.value) })}
                  placeholder="0"
                  className="h-10 tabular-nums"
                />
              </FormField>
            </div>

            <FormField id={`${idPrefix}-notes`} label="Notes">
              <Textarea
                id={`${idPrefix}-notes`}
                value={values.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Délais habituels, zones couvertes, remarques…"
                rows={2}
                className="resize-none"
              />
            </FormField>
          </div>
        )}
      </div>

      {/* ── Disponibilité ── */}
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/70 px-4 py-3">
        <span>
          <span className="block text-sm font-medium text-foreground">Disponible pour missions</span>
          <span className="block text-xs text-muted-foreground">
            Décochez si le transporteur est suspendu ou en maintenance.
          </span>
        </span>
        <Switch
          checked={values.statut === "Actif"}
          onCheckedChange={(on) => onChange({ statut: on ? "Actif" : "Inactif" })}
        />
      </label>
    </div>
  );
}

export function validateTransporteurForm(
  values: TransporteurInput,
): Partial<Record<keyof TransporteurInput, string>> {
  const errors: Partial<Record<keyof TransporteurInput, string>> = {};
  if (!values.nom.trim()) errors.nom = "Le nom est obligatoire.";
  if (!values.telephone.trim()) errors.telephone = "Le téléphone est obligatoire.";
  return errors;
}
