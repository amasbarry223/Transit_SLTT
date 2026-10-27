"use client";

import {
  ArrowRight,
  FolderKanban,
  Save,
  Truck,
} from "lucide-react";
import type { Annexe, Client } from "@/lib/domain-types";
import { QuickClientButton } from "@/features/clients";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn";
import { WIZARD_STEPS, type DossierFormErrors } from "./use-dossier-form-state";
import { CollapsibleSection, FormField, SectionTitle } from "./dossier-form-ui";

type DossierWizardProgressProps = {
  wizardStep: number;
  mode?: "wizard" | "sections";
};

export function DossierWizardProgress({ wizardStep, mode = "wizard" }: DossierWizardProgressProps) {
  if (mode === "sections") {
    return (
      <Card className="border-border/80 p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          {WIZARD_STEPS.map((step) => (
            <div
              key={step.id}
              className="rounded-lg border border-border/70 px-3 py-2.5 bg-muted/40"
            >
              <p className="text-xs font-semibold text-primary">{step.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{step.hint}</p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
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
  annexes: Annexe[];
  annexeId: string;
  clientId: string;
  nature: string;
  bl: string;
  camion: string;
  date: string;
  errors: DossierFormErrors;
  touched: Record<string, boolean>;
  onAnnexeIdChange: (value: string) => void;
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
  annexes,
  annexeId,
  clientId,
  nature,
  bl,
  camion,
  date,
  errors,
  touched,
  onAnnexeIdChange,
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
        description="Annexe, client et caractéristiques de la marchandise"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="dossier-annexe-select" label="Annexe" required error={errors.annexeId}>
          <Select
            value={annexeId}
            onValueChange={(v) => {
              onAnnexeIdChange(v);
              onTouch("annexeId");
              onValidateField("annexeId", v);
            }}
          >
            <SelectTrigger
              id="dossier-annexe-select"
              className={cn("h-10 w-full", errors.annexeId && "border-red-400")}
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
        </FormField>

        <FormField id="dossier-client-select" label="Client" required error={errors.clientId}>
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
                id="dossier-client-select"
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
            placeholder="Ex. BL-0000"
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
            placeholder="Ex. AB 1234 CD"
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
  nombreColis: string;
  isMali?: boolean;
  onModeTransportChange: (value: string) => void;
  onPortEntreeChange: (value: string) => void;
  onNoConteneurChange: (value: string) => void;
  onPoidsTotalChange: (value: string) => void;
  onNombreColisChange: (value: string) => void;
};

export function DossierTransportSection({
  isEdit,
  modeTransport,
  portEntree,
  noConteneur,
  poidsTotal,
  nombreColis,
  isMali = false,
  onModeTransportChange,
  onPortEntreeChange,
  onNoConteneurChange,
  onPoidsTotalChange,
  onNombreColisChange,
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
        <FormField id="dossier-mode-transport" label="Mode de transport">
          <Select value={modeTransport} onValueChange={onModeTransportChange}>
            <SelectTrigger id="dossier-mode-transport" className="h-10">
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
        {!isMali && (
          <FormField label="Port d'embarquement / d'entrée">
            <Input
              className="h-10"
              value={portEntree}
              onChange={(e) => onPortEntreeChange(e.target.value)}
              placeholder="Ex. Port d'Abidjan"
            />
          </FormField>
        )}
        {modeTransport === "Maritime" && (
          <FormField label="N° de conteneur">
            <Input
              className="h-10 font-mono"
              value={noConteneur}
              onChange={(e) => onNoConteneurChange(e.target.value)}
              placeholder="Ex. CONTENEUR1234567"
            />
          </FormField>
        )}
        <FormField label="Poids total (kg)">
          <Input
            type="number"
            min={0}
            className="h-10"
            value={poidsTotal}
            onChange={(e) => onPoidsTotalChange(e.target.value)}
            placeholder="Ex. 15 000 kg"
          />
        </FormField>
        <FormField label="Quantité (colis / conteneurs)">
          <Input
            type="number"
            min={0}
            step={1}
            className="h-10"
            value={nombreColis}
            onChange={(e) => onNombreColisChange(e.target.value)}
            placeholder="Ex. 1"
          />
        </FormField>
      </div>
    </CollapsibleSection>
  );
}

type DossierWizardNavProps = {
  wizardStep: number;
  canWrite: boolean;
  saving?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
};

export function DossierWizardNav({
  wizardStep,
  canWrite,
  saving,
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
          disabled={!canWrite || saving}
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
