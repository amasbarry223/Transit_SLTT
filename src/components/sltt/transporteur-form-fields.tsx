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
  Building2,
  Gauge,
  Check,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TransporteurInput, TransporteurStatut, TypeVehicule } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const VEHICULES: TypeVehicule[] = [
  "Camion",
  "Remorque",
  "Semi-remorque",
  "Benne",
  "Fourgon",
];

export const TRAJETS_SUGGERES = [
  "Bamako – Dakar",
  "Bamako – Abidjan",
  "Bamako – Conakry",
  "Bamako – Niamey",
  "Local Bamako",
] as const;

export const CAPACITE_PRESETS = [5, 10, 20, 30, 35] as const;

export const TRANSPORTEUR_FORM_STEPS = [
  { id: "partenaire", label: "Partenaire", description: "Société et contact", icon: Building2 },
  { id: "coordonnees", label: "Coordonnées", description: "Téléphone et e-mail", icon: Phone },
  { id: "flotte", label: "Flotte", description: "Véhicule et trajet", icon: Truck },
  { id: "validation", label: "Validation", description: "Statut et récapitulatif", icon: ClipboardList },
] as const;

export type TransporteurFormStepId = (typeof TRANSPORTEUR_FORM_STEPS)[number]["id"];

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

interface FieldProps {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ id, label, required, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TransporteurFormStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedThrough: number;
}

export function TransporteurFormStepper({
  currentStep,
  onStepClick,
  completedThrough,
}: TransporteurFormStepperProps) {
  return (
    <nav aria-label="Étapes du formulaire" className="w-full">
      <ol className="flex items-start">
        {TRANSPORTEUR_FORM_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const reachable = i <= completedThrough;
          const isLast = i === TRANSPORTEUR_FORM_STEPS.length - 1;
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className={cn("flex flex-col", !isLast && "flex-1")}
              aria-current={active ? "step" : undefined}
            >
              <div className="flex w-full items-center">
                <button
                  type="button"
                  disabled={!reachable || !onStepClick}
                  onClick={() => reachable && onStepClick?.(i)}
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                    done && "border-primary bg-primary text-white",
                    active && "border-primary bg-primary text-white ring-4 ring-primary/20",
                    !done && !active && reachable && "border-slate-200 bg-white text-slate-500 hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900",
                    !reachable && "cursor-default border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900/50",
                  )}
                  title={step.label}
                >
                  {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                </button>
                {!isLast && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded-full transition-colors",
                      done ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
                    )}
                  />
                )}
              </div>
              <div className={cn("mt-2 hidden pr-3 sm:block", !isLast && "max-w-[88px]")}>
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    active ? "text-primary" : done ? "text-slate-700 dark:text-slate-300" : "text-slate-400",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-slate-400 dark:text-slate-500">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400 sm:hidden">
        Étape {currentStep + 1} / {TRANSPORTEUR_FORM_STEPS.length} — {TRANSPORTEUR_FORM_STEPS[currentStep].label}
      </p>
    </nav>
  );
}

interface TransporteurFormFieldsProps {
  values: TransporteurInput;
  onChange: (patch: Partial<TransporteurInput>) => void;
  errors?: Partial<Record<keyof TransporteurInput, string>>;
  idPrefix?: string;
  autoFocusNom?: boolean;
  step?: number;
}

export function TransporteurFormFields({
  values,
  onChange,
  errors = {},
  idPrefix = "tr",
  autoFocusNom,
  step,
}: TransporteurFormFieldsProps) {
  const showAll = step === undefined;
  const showPartenaire = showAll || step === 0;
  const showCoordonnees = showAll || step === 1;
  const showFlotte = showAll || step === 2;
  const showValidation = showAll || step === 3;

  return (
    <div className="space-y-6">
      {showPartenaire && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Identité du partenaire</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Renseignez la société et la personne référente pour ce transporteur.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${idPrefix}-nom`} label="Société / Nom" required error={errors.nom}>
              <Input
                id={`${idPrefix}-nom`}
                value={values.nom}
                onChange={(e) => onChange({ nom: e.target.value })}
                placeholder="Konaté Transport SARL"
                className={cn("h-10", errors.nom && "border-red-400 focus-visible:ring-red-400")}
                autoFocus={autoFocusNom}
              />
            </Field>
            <Field id={`${idPrefix}-contact`} label="Personne de contact" required error={errors.contact}>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`${idPrefix}-contact`}
                  value={values.contact}
                  onChange={(e) => onChange({ contact: e.target.value })}
                  placeholder="Mamadou Konaté"
                  className={cn("h-10 pl-9", errors.contact && "border-red-400 focus-visible:ring-red-400")}
                />
              </div>
            </Field>
          </div>
        </section>
      )}

      {showCoordonnees && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Coordonnées</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Comment joindre ce partenaire pour une mission ou un suivi.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${idPrefix}-tel`} label="Téléphone" required error={errors.telephone}>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`${idPrefix}-tel`}
                  type="tel"
                  value={values.telephone}
                  onChange={(e) => onChange({ telephone: e.target.value })}
                  placeholder="+223 76 00 00 00"
                  className={cn("h-10 pl-9", errors.telephone && "border-red-400 focus-visible:ring-red-400")}
                />
              </div>
            </Field>
            <Field id={`${idPrefix}-email`} label="E-mail" hint="Facultatif">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`${idPrefix}-email`}
                  type="email"
                  value={values.email}
                  onChange={(e) => onChange({ email: e.target.value })}
                  placeholder="transport@mail.ml"
                  className="h-10 pl-9"
                />
              </div>
            </Field>
          </div>
        </section>
      )}

      {showFlotte && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Véhicule & trajet</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Décrivez la flotte et les axes habituellement couverts.
            </p>
          </div>

          <Field label="Type de véhicule" required>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
                        : "border-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="text-xs font-semibold leading-tight">{v}</span>
                    <span className="hidden text-[10px] text-slate-400 sm:block">{hint}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${idPrefix}-immat`}
              label="Immatriculation"
              required
              error={errors.immatriculation}
              hint="Format malien : BK-0000-ML"
            >
              <Input
                id={`${idPrefix}-immat`}
                value={values.immatriculation}
                onChange={(e) => onChange({ immatriculation: e.target.value.toUpperCase() })}
                placeholder="BK-0845-ML"
                className={cn(
                  "h-10 font-mono uppercase tracking-wide",
                  errors.immatriculation && "border-red-400 focus-visible:ring-red-400",
                )}
              />
            </Field>
            <Field id={`${idPrefix}-capacite`} label="Capacité (tonnes)" required error={errors.capacite}>
              <div className="space-y-2">
                <div className="relative">
                  <Gauge className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id={`${idPrefix}-capacite`}
                    type="number"
                    min={1}
                    max={80}
                    value={values.capacite}
                    onChange={(e) => onChange({ capacite: Number(e.target.value) })}
                    className={cn(
                      "h-10 pl-9 tabular-nums",
                      errors.capacite && "border-red-400 focus-visible:ring-red-400",
                    )}
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
                          : "border-border text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                      )}
                    >
                      {t} t
                    </button>
                  ))}
                </div>
              </div>
            </Field>
          </div>

          <Field id={`${idPrefix}-trajet`} label="Trajet habituel" required error={errors.trajet}>
            <div className="space-y-2">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`${idPrefix}-trajet`}
                  value={values.trajet}
                  onChange={(e) => onChange({ trajet: e.target.value })}
                  placeholder="Bamako – Dakar"
                  className={cn("h-10 pl-9", errors.trajet && "border-red-400 focus-visible:ring-red-400")}
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
                        : "border-border text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </section>
      )}

      {showValidation && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Disponibilité & notes</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Indiquez si le partenaire peut recevoir de nouvelles missions.
            </p>
          </div>

          <Field label="Statut opérationnel">
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
                      selected && s === "Inactif" && "border-slate-400 bg-slate-50 dark:bg-slate-800/60",
                      !selected && "border-border hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        s === "Actif" ? "bg-emerald-500" : "bg-slate-400",
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s === "Actif" ? "Disponible pour missions" : "Suspendu ou en maintenance"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field id={`${idPrefix}-notes`} label="Notes" hint="Facultatif">
            <Textarea
              id={`${idPrefix}-notes`}
              value={values.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Délais habituels, zones couvertes, remarques…"
              rows={3}
              className="resize-none"
            />
          </Field>

          <TransporteurFormSummary values={values} />
        </section>
      )}
    </div>
  );
}

export function TransporteurFormSummary({ values }: { values: TransporteurInput }) {
  const rows = [
    { label: "Société", value: values.nom || "—" },
    { label: "Contact", value: values.contact || "—" },
    { label: "Téléphone", value: values.telephone || "—" },
    { label: "E-mail", value: values.email?.trim() || "—" },
    { label: "Véhicule", value: values.vehicule },
    { label: "Immatriculation", value: values.immatriculation || "—", mono: true },
    { label: "Capacité", value: values.capacite > 0 ? `${values.capacite} t` : "—" },
    { label: "Trajet", value: values.trajet || "—" },
    {
      label: "Statut",
      value: values.statut,
      badge: values.statut === "Actif" ? "emerald" : "slate",
    },
  ] as const;

  return (
    <div className="rounded-xl border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-800/40">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="size-4 text-primary" />
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Récapitulatif</p>
      </div>
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
            <dt className="shrink-0 text-slate-500 dark:text-slate-400">{row.label}</dt>
            <dd
              className={cn(
                "text-right font-medium text-slate-900 dark:text-slate-100",
                "mono" in row && row.mono && "font-mono text-xs uppercase tracking-wide",
              )}
            >
              {"badge" in row && row.badge ? (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                    row.badge === "emerald"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                  )}
                >
                  {row.value}
                </span>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {values.notes?.trim() && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Notes</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{values.notes}</p>
        </div>
      )}
    </div>
  );
}

const STEP_FIELDS: (keyof TransporteurInput)[][] = [
  ["nom", "contact"],
  ["telephone"],
  ["vehicule", "immatriculation", "capacite", "trajet"],
  [],
];

export function validateTransporteurStep(
  step: number,
  values: TransporteurInput,
): Partial<Record<keyof TransporteurInput, string>> {
  const all = validateTransporteurForm(values);
  const fields = STEP_FIELDS[step] ?? [];
  if (fields.length === 0) return all;
  return Object.fromEntries(
    fields.filter((f) => all[f]).map((f) => [f, all[f]!]),
  ) as Partial<Record<keyof TransporteurInput, string>>;
}

export function isTransporteurStepValid(step: number, values: TransporteurInput): boolean {
  return Object.keys(validateTransporteurStep(step, values)).length === 0;
}

export function isTransporteurFormValid(values: TransporteurInput): boolean {
  return Object.keys(validateTransporteurForm(values)).length === 0;
}

export function validateTransporteurForm(values: TransporteurInput): Partial<Record<keyof TransporteurInput, string>> {
  const errors: Partial<Record<keyof TransporteurInput, string>> = {};
  if (!values.nom.trim()) errors.nom = "Nom requis";
  if (!values.contact.trim()) errors.contact = "Contact requis";
  if (!values.telephone.trim()) errors.telephone = "Téléphone requis";
  if (!values.immatriculation.trim()) errors.immatriculation = "Immatriculation requise";
  if (!values.trajet.trim()) errors.trajet = "Trajet requis";
  if (!values.capacite || values.capacite <= 0) errors.capacite = "Capacité invalide";
  return errors;
}

export function firstInvalidTransporteurStep(values: TransporteurInput): number {
  for (let i = 0; i < STEP_FIELDS.length; i++) {
    const stepErrors = validateTransporteurStep(i, values);
    if (Object.keys(stepErrors).length > 0) return i;
  }
  return 0;
}

export function maxReachableStep(values: TransporteurInput): number {
  for (let i = 0; i < TRANSPORTEUR_FORM_STEPS.length - 1; i++) {
    if (!isTransporteurStepValid(i, values)) return i;
  }
  return TRANSPORTEUR_FORM_STEPS.length - 1;
}
