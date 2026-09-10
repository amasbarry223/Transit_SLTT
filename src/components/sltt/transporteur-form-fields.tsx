"use client";

import {
  Truck,
  Container,
  Package,
  Box,
  Car,
  Phone,
  Mail,
  MapPin,
  User,
  Gauge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TransporteurInput, TransporteurStatut, TypeVehicule } from "@/lib/store";
import { FormField } from "@/components/sltt/form-field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";

export const VEHICULES: TypeVehicule[] = [
  "Camion",
  "Remorque",
  "Semi-remorque",
  "Benne",
  "Fourgon",
];

const TRAJETS_SUGGERES = [
  "Bamako – Dakar",
  "Bamako – Abidjan",
  "Bamako – Conakry",
  "Bamako – Niamey",
  "Local Bamako",
] as const;

const CAPACITE_PRESETS = [5, 10, 20, 30, 35] as const;

const VEHICULE_META: Record<TypeVehicule, { icon: LucideIcon; hint: string }> = {
  Camion: { icon: Truck, hint: "Porteur classique" },
  Remorque: { icon: Container, hint: "Remorque seule" },
  "Semi-remorque": { icon: Package, hint: "Longue distance" },
  Benne: { icon: Box, hint: "Matériaux en vrac" },
  Fourgon: { icon: Car, hint: "Livraisons urbaines" },
};

export function emptyTransporteurForm(): TransporteurInput {
  return {
    nom: "",
    contact: "",
    telephone: "",
    email: "",
    vehicule: "Camion",
    immatriculation: "",
    trajet: "",
    capacite: 10,
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

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TransporteurFormFields({
  values,
  onChange,
  errors = {},
  idPrefix = "tr",
  autoFocusNom,
}: TransporteurFormFieldsProps) {
  const errCls = (k: keyof TransporteurInput) =>
    errors[k] ? "border-red-400 focus-visible:ring-red-400" : "";

  return (
    <div className="space-y-7">
      {/* ── Le partenaire : qui c'est et comment le joindre ── */}
      <section>
        <SectionTitle hint="Société, personne référente et coordonnées pour le contacter.">
          Le partenaire
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${idPrefix}-nom`} label="Société / Nom" required error={errors.nom}>
            <Input
              id={`${idPrefix}-nom`}
              value={values.nom}
              onChange={(e) => onChange({ nom: e.target.value })}
              placeholder="Ex. Transport Express SARL"
              className={cn("h-10", errCls("nom"))}
              autoFocus={autoFocusNom}
            />
          </FormField>

          <FormField
            id={`${idPrefix}-contact`}
            label="Personne de contact"
            required
            error={errors.contact}
          >
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`${idPrefix}-contact`}
                value={values.contact}
                onChange={(e) => onChange({ contact: e.target.value })}
                placeholder="Prénom Nom"
                className={cn("h-10 pl-9", errCls("contact"))}
              />
            </div>
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

          <FormField id={`${idPrefix}-email`} label="E-mail" hint="Facultatif">
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
        </div>
      </section>

      {/* ── Le véhicule : ce qu'il peut transporter et où ── */}
      <section>
        <SectionTitle hint="Type de véhicule, immatriculation, capacité et axe habituel.">
          Le véhicule
        </SectionTitle>

        <FormField label="Type de véhicule" required>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {VEHICULES.map((v) => {
              const { icon: Icon, hint } = VEHICULE_META[v];
              const selected = values.vehicule === v;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ vehicule: v })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-colors",
                    selected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">{v}</span>
                  <span className="hidden text-[10px] text-muted-foreground/80 sm:block">{hint}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            id={`${idPrefix}-immat`}
            label="Immatriculation"
            required
            error={errors.immatriculation}
            hint="Ex. AB-1234-ML"
          >
            <Input
              id={`${idPrefix}-immat`}
              value={values.immatriculation}
              onChange={(e) => onChange({ immatriculation: e.target.value.toUpperCase() })}
              placeholder="AB-1234-ML"
              className={cn(
                "h-10 font-mono uppercase tracking-wide",
                errCls("immatriculation"),
              )}
            />
          </FormField>

          <FormField
            id={`${idPrefix}-capacite`}
            label="Capacité (tonnes)"
            required
            error={errors.capacite}
          >
            <div className="space-y-2">
              <div className="relative">
                <Gauge className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${idPrefix}-capacite`}
                  type="number"
                  min={1}
                  max={80}
                  value={values.capacite}
                  onChange={(e) => onChange({ capacite: Number(e.target.value) })}
                  className={cn("h-10 pl-9 tabular-nums", errCls("capacite"))}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CAPACITE_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ capacite: t })}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
                      values.capacite === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted",
                    )}
                  >
                    {t} t
                  </button>
                ))}
              </div>
            </div>
          </FormField>
        </div>

        <div className="mt-4">
        <FormField
          id={`${idPrefix}-trajet`}
          label="Trajet habituel"
          required
          error={errors.trajet}
        >
          <div className="space-y-2">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`${idPrefix}-trajet`}
                value={values.trajet}
                onChange={(e) => onChange({ trajet: e.target.value })}
                placeholder="Bamako – Dakar"
                className={cn("h-10 pl-9", errCls("trajet"))}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRAJETS_SUGGERES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ trajet: t })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    values.trajet === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </FormField>
        </div>
      </section>

      {/* ── Disponibilité ── */}
      <section>
        <SectionTitle hint="Le partenaire peut-il recevoir de nouvelles missions ?">
          Disponibilité
        </SectionTitle>

        <FormField label="Statut opérationnel">
          <div className="grid grid-cols-2 gap-2">
            {(["Actif", "Inactif"] as TransporteurStatut[]).map((s) => {
              const selected = values.statut === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ statut: s })}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
                    selected && s === "Actif" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
                    selected && s === "Inactif" && "border-slate-400 bg-muted/60",
                    !selected && "border-border hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      s === "Actif" ? "bg-emerald-500" : "bg-slate-400",
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s}</p>
                    <p className="text-xs text-muted-foreground">
                      {s === "Actif" ? "Disponible pour missions" : "Suspendu ou en maintenance"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </FormField>

        <div className="mt-4">
          <FormField id={`${idPrefix}-notes`} label="Notes" hint="Facultatif">
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
      </section>
    </div>
  );
}

export function validateTransporteurForm(
  values: TransporteurInput,
): Partial<Record<keyof TransporteurInput, string>> {
  const errors: Partial<Record<keyof TransporteurInput, string>> = {};
  if (!values.nom.trim()) errors.nom = "Le nom est obligatoire.";
  if (!values.contact.trim()) errors.contact = "Contact requis";
  if (!values.telephone.trim()) errors.telephone = "Téléphone requis";
  if (!values.immatriculation.trim()) errors.immatriculation = "Immatriculation requise";
  if (!values.trajet.trim()) errors.trajet = "Trajet requis";
  if (!values.capacite || values.capacite <= 0) errors.capacite = "Capacité invalide";
  return errors;
}
