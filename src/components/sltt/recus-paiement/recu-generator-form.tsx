"use client";

import { CalendarDays, CreditCard, Hash, UserRound } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RecuFormSection } from "./recu-form-section";
import { SignaturePad } from "./signature-pad";
import type { RecuGeneratorFormState } from "./use-recu-generator";
import type { RecuPaiementStatut } from "@/lib/domain-types";

const STATUT_LABELS: Record<RecuPaiementStatut, string> = {
  EN_ATTENTE: "En attente",
  PARTIEL: "Partiel",
  SOLDE: "Soldé",
};

const STATUT_BADGE_CLASS: Record<RecuPaiementStatut, string> = {
  SOLDE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
  PARTIEL: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
  EN_ATTENTE: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400",
};

interface RecuGeneratorFormProps {
  form: RecuGeneratorFormState;
  previewReference: string;
  reste: number;
  statut: RecuPaiementStatut;
  somme: number;
  montantPaye: number;
  montantPayeDepasseSomme: boolean;
  onFieldChange: <K extends keyof RecuGeneratorFormState>(key: K, value: RecuGeneratorFormState[K]) => void;
  onSignatureChange: (signature: string | null) => void;
}

function PaymentProgress({ somme, montantPaye }: { somme: number; montantPaye: number }) {
  const pct = somme > 0 ? Math.min(100, Math.round((montantPaye / somme) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Progression du paiement</span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function RecuGeneratorForm({
  form,
  previewReference,
  reste,
  statut,
  somme,
  montantPaye,
  montantPayeDepasseSomme,
  onFieldChange,
  onSignatureChange,
}: RecuGeneratorFormProps) {
  return (
    <div className="space-y-8">
      <RecuFormSection
        title="Référence"
        description="Numéro généré automatiquement à l'enregistrement."
        icon={Hash}
      >
        <div className="space-y-2">
          <Label htmlFor="recu-numero" className="sr-only">
            Numéro du reçu
          </Label>
          <Input
            id="recu-numero"
            value={previewReference}
            readOnly
            className="h-11 border-dashed bg-muted/30 font-mono text-sm tracking-wide"
          />
        </div>
      </RecuFormSection>

      <Separator />

      <RecuFormSection title="Bénéficiaire" description="Personne ou entité qui reçoit le paiement." icon={UserRound}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recu-nom">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recu-nom"
              value={form.nom}
              onChange={(e) => onFieldChange("nom", e.target.value)}
              placeholder="Ex. TRAORE"
              className="h-11"
              autoComplete="family-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recu-prenom">
              Prénom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recu-prenom"
              value={form.prenom}
              onChange={(e) => onFieldChange("prenom", e.target.value)}
              placeholder="Ex. Amadou"
              className="h-11"
              autoComplete="given-name"
            />
          </div>
        </div>
      </RecuFormSection>

      <Separator />

      <RecuFormSection title="Détails du paiement" description="Montants et motif du règlement." icon={CreditCard}>
        <div className="space-y-2">
          <Label htmlFor="recu-motif">
            Motif <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recu-motif"
            value={form.motif}
            onChange={(e) => onFieldChange("motif", e.target.value)}
            placeholder="Ex. Frais de prestation de transit"
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recu-somme">
              La somme de (FCFA) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recu-somme"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.somme}
              onChange={(e) => onFieldChange("somme", e.target.value)}
              placeholder="100 000"
              className="h-11 tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recu-montant-paye">
              Montant payé (FCFA) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recu-montant-paye"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.montantPaye}
              onChange={(e) => onFieldChange("montantPaye", e.target.value)}
              placeholder="70 000"
              className={cn("h-11 tabular-nums", montantPayeDepasseSomme && "border-red-400 focus-visible:ring-red-400")}
            />
            {montantPayeDepasseSomme ? (
              <p className="text-xs text-red-600 dark:text-red-400">Ne peut pas dépasser la somme totale.</p>
            ) : null}
          </div>
        </div>

        {somme > 0 ? <PaymentProgress somme={somme} montantPaye={montantPaye} /> : null}

        <div className="rounded-xl border border-border/80 bg-gradient-to-br from-slate-50/80 to-white p-4 dark:from-slate-900/40 dark:to-slate-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Reste à payer</p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {formatFCFA(reste)}
              </p>
            </div>
            <Badge variant="outline" className={cn("px-3 py-1 text-xs font-medium", STATUT_BADGE_CLASS[statut])}>
              {STATUT_LABELS[statut]}
            </Badge>
          </div>
        </div>
      </RecuFormSection>

      <Separator />

      <RecuFormSection title="Date et signature" description="Informations affichées en bas du reçu." icon={CalendarDays}>
        <div className="space-y-2">
          <Label htmlFor="recu-date">Date du paiement</Label>
          <Input
            id="recu-date"
            type="date"
            value={form.date}
            onChange={(e) => onFieldChange("date", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label>Signature</Label>
          <SignaturePad value={form.signature} onChange={onSignatureChange} />
        </div>
      </RecuFormSection>
    </div>
  );
}
