"use client";

import {
  ArrowRight,
  FolderKanban,
  ListChecks,
  Save,
  Truck,
} from "lucide-react";
import type { Client } from "@/lib/domain-types";
import type { DossierStatut } from "@/lib/domain-types";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
import { DossierStatutBadge } from "@/components/sltt/status-badge";
import { TRANSITION_META, type TransitionType } from "@/components/sltt/dossier-transition-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS, type DossierFormErrors } from "./use-dossier-form-state";
import { CollapsibleSection, FormField, SectionTitle } from "./dossier-form-ui";

type DossierWizardProgressProps = {
  wizardStep: number;
};

export function DossierWizardProgress({ wizardStep }: DossierWizardProgressProps) {
  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Étape {wizardStep} sur {WIZARD_STEPS.length} — {WIZARD_STEPS[wizardStep - 1]?.label}
        </span>
        <span className="hidden sm:inline">{WIZARD_STEPS[wizardStep - 1]?.hint}</span>
      </div>
      <div className="flex gap-2">
        {WIZARD_STEPS.map((step) => (
          <div
            key={step.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              step.id <= wizardStep ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
            )}
          />
        ))}
      </div>
    </Card>
  );
}

type DossierIdentityStepProps = {
  clients: Client[];
  clientId: string;
  nature: string;
  bl: string;
  camion: string;
  date: string;
  errors: DossierFormErrors;
  touched: Record<string, boolean>;
  onClientIdChange: (value: string) => void;
  onNatureChange: (value: string) => void;
  onBlChange: (value: string) => void;
  onCamionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onFieldBlur: (field: keyof DossierFormErrors) => void;
  onValidateField: (field: keyof DossierFormErrors, value: string) => void;
  onTouch: (field: string) => void;
};

export function DossierIdentityStep({
  clients,
  clientId,
  nature,
  bl,
  camion,
  date,
  errors,
  touched,
  onClientIdChange,
  onNatureChange,
  onBlChange,
  onCamionChange,
  onDateChange,
  onFieldBlur,
  onValidateField,
  onTouch,
}: DossierIdentityStepProps) {
  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <SectionTitle
        icon={<FolderKanban className="size-4" />}
        tone="blue"
        title="Informations générales"
        description="Client et caractéristiques de la marchandise"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Client" required error={errors.clientId}>
          <div className="flex gap-2">
            <Select
              value={clientId}
              onValueChange={(v) => {
                onClientIdChange(v);
                onTouch("clientId");
                onValidateField("clientId", v);
              }}
            >
              <SelectTrigger
                className={cn("h-10 w-full", errors.clientId && "border-red-400")}
                aria-label="Sélectionner un client"
              >
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickClientButton
              onCreated={(id) => {
                onClientIdChange(id);
                onTouch("clientId");
                onValidateField("clientId", id);
              }}
            />
          </div>
        </FormField>

        <FormField label="Nature de la marchandise" required error={errors.nature}>
          <Input
            className={cn("h-10", errors.nature && "border-red-400")}
            value={nature}
            onChange={(e) => {
              onNatureChange(e.target.value);
              if (touched.nature) onValidateField("nature", e.target.value);
            }}
            onBlur={() => onFieldBlur("nature")}
            placeholder="Ex. Matériel électronique"
          />
        </FormField>

        <FormField
          label="N° de BL"
          required
          error={errors.bl}
          hint="Numéro du connaissement (Bill of Lading) — le document qui identifie la marchandise transportée."
        >
          <Input
            className={cn("h-10", errors.bl && "border-red-400")}
            value={bl}
            onChange={(e) => {
              onBlChange(e.target.value);
              if (touched.bl) onValidateField("bl", e.target.value);
            }}
            onBlur={() => onFieldBlur("bl")}
            placeholder="BL-0000"
          />
        </FormField>

        <FormField label="N° du camion" required error={errors.camion}>
          <Input
            className={cn("h-10", errors.camion && "border-red-400")}
            value={camion}
            onChange={(e) => {
              onCamionChange(e.target.value);
              if (touched.camion) onValidateField("camion", e.target.value);
            }}
            onBlur={() => onFieldBlur("camion")}
            placeholder="Ex. RJ 4521 KM"
          />
        </FormField>

        <FormField label="Date" required error={errors.date}>
          <Input
            type="date"
            className={cn("h-10", errors.date && "border-red-400")}
            value={date}
            onChange={(e) => {
              onDateChange(e.target.value);
              if (touched.date) onValidateField("date", e.target.value);
            }}
            onBlur={() => onFieldBlur("date")}
          />
        </FormField>
      </div>
    </Card>
  );
}

type DossierTransportSectionProps = {
  isEdit: boolean;
  modeTransport: string;
  portEntree: string;
  noConteneur: string;
  poidsTotal: string;
  onModeTransportChange: (value: string) => void;
  onPortEntreeChange: (value: string) => void;
  onNoConteneurChange: (value: string) => void;
  onPoidsTotalChange: (value: string) => void;
};

export function DossierTransportSection({
  isEdit,
  modeTransport,
  portEntree,
  noConteneur,
  poidsTotal,
  onModeTransportChange,
  onPortEntreeChange,
  onNoConteneurChange,
  onPoidsTotalChange,
}: DossierTransportSectionProps) {
  return (
    <CollapsibleSection
      icon={<Truck className="size-4" />}
      tone="indigo"
      title="Transport & Logistique"
      description="Mode de transport, conteneur et point d'entrée"
      defaultOpen={isEdit}
      badge={isEdit ? undefined : "Optionnel"}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Mode de transport">
          <Select value={modeTransport} onValueChange={onModeTransportChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Sélectionner…" />
            </SelectTrigger>
            <SelectContent>
              {["Maritime", "Aérien", "Routier", "Ferroviaire"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Port / Frontière d'entrée">
          <Input
            className="h-10"
            value={portEntree}
            onChange={(e) => onPortEntreeChange(e.target.value)}
            placeholder="Ex. Port de Dakar"
          />
        </FormField>
        {modeTransport === "Maritime" && (
          <FormField label="N° de conteneur">
            <Input
              className="h-10 font-mono"
              value={noConteneur}
              onChange={(e) => onNoConteneurChange(e.target.value)}
              placeholder="Ex. MSCU4521789"
            />
          </FormField>
        )}
        <FormField label="Poids total (kg)">
          <Input
            type="number"
            className="h-10"
            value={poidsTotal}
            onChange={(e) => onPoidsTotalChange(e.target.value)}
            placeholder="0"
          />
        </FormField>
      </div>
    </CollapsibleSection>
  );
}

type DossierSuiviSectionProps = {
  isEdit: boolean;
  statut: DossierStatut;
  nextTransition: TransitionType | null;
  canTransition: boolean;
  dateEcheance: string;
  dateDedouanement: string;
  notes: string;
  onTransitionOpen: () => void;
  onDateEcheanceChange: (value: string) => void;
  onDateDedouanementChange: (value: string) => void;
  onNotesChange: (value: string) => void;
};

export function DossierSuiviSection({
  isEdit,
  statut,
  nextTransition,
  canTransition,
  dateEcheance,
  dateDedouanement,
  notes,
  onTransitionOpen,
  onDateEcheanceChange,
  onDateDedouanementChange,
  onNotesChange,
}: DossierSuiviSectionProps) {
  return (
    <CollapsibleSection
      icon={<ListChecks className="size-4" />}
      tone="indigo"
      title="Suivi"
      description="Statut du dossier et observations internes"
      defaultOpen={isEdit}
      badge={isEdit ? undefined : "Optionnel"}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Statut">
          {isEdit ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <DossierStatutBadge statut={statut} />
              {nextTransition && canTransition ? (
                <Button type="button" variant="outline" size="sm" onClick={onTransitionOpen}>
                  <ArrowRight className="size-3.5" />
                  {TRANSITION_META[nextTransition].actionLabel}
                </Button>
              ) : nextTransition ? (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Vous n'avez pas la permission de changer le statut de ce dossier.
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Statut final — aucune transition possible
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <DossierStatutBadge statut="En cours" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tout nouveau dossier démarre à « En cours ». Les transitions se font ensuite depuis
                la fiche dossier.
              </span>
            </div>
          )}
          {isEdit && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Le statut se fait uniquement avancer via une transition guidée, qui enregistre le
              paiement associé.
            </p>
          )}
        </FormField>

        <FormField label="Date d'échéance">
          <Input
            type="date"
            className="h-10"
            value={dateEcheance}
            onChange={(e) => onDateEcheanceChange(e.target.value)}
          />
        </FormField>

        <FormField label="Date de dédouanement">
          <Input
            type="date"
            className="h-10"
            value={dateDedouanement}
            onChange={(e) => onDateDedouanementChange(e.target.value)}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Notes">
            <Textarea
              className="min-h-24"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Observations, particularités du dossier…"
            />
          </FormField>
        </div>
      </div>
    </CollapsibleSection>
  );
}

type DossierWizardNavProps = {
  wizardStep: number;
  canWrite: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
};

export function DossierWizardNav({
  wizardStep,
  canWrite,
  onPrev,
  onNext,
  onSave,
}: DossierWizardNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={onPrev} disabled={wizardStep === 1}>
        Précédent
      </Button>
      {wizardStep < 3 ? (
        <Button type="button" onClick={onNext}>
          Suivant
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onSave}
          disabled={!canWrite}
          title={
            !canWrite ? "Vous n'avez pas la permission d'enregistrer un dossier." : undefined
          }
        >
          <Save className="size-4" />
          Enregistrer le dossier
        </Button>
      )}
    </div>
  );
}
