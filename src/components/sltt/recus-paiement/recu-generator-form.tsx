"use client";

import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "./signature-pad";
import type { RecuGeneratorFormState } from "./use-recu-generator";
import type { RecuPaiementStatut } from "@/lib/domain-types";

const STATUT_LABELS: Record<RecuPaiementStatut, string> = {
  EN_ATTENTE: "En attente",
  PARTIEL: "Partiel",
  SOLDE: "Soldé",
};

const STATUT_BADGE_CLASS: Record<RecuPaiementStatut, string> = {
  SOLDE: "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400",
  PARTIEL: "border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-400",
  EN_ATTENTE: "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400",
};

interface RecuGeneratorFormProps {
  form: RecuGeneratorFormState;
  previewReference: string;
  reste: number;
  statut: RecuPaiementStatut;
  montantPayeDepasseSomme: boolean;
  onFieldChange: <K extends keyof RecuGeneratorFormState>(key: K, value: RecuGeneratorFormState[K]) => void;
  onSignatureChange: (signature: string | null) => void;
}

export function RecuGeneratorForm({
  form,
  previewReference,
  reste,
  statut,
  montantPayeDepasseSomme,
  onFieldChange,
  onSignatureChange,
}: RecuGeneratorFormProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recu-numero">Numéro du reçu</Label>
        <Input id="recu-numero" value={previewReference} readOnly className="h-10 bg-muted/40 font-mono" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Généré automatiquement à l&apos;enregistrement.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recu-nom">
            Nom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recu-nom"
            value={form.nom}
            onChange={(e) => onFieldChange("nom", e.target.value)}
            className="h-10"
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
            className="h-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recu-motif">
          Motif <span className="text-red-500">*</span>
        </Label>
        <Input
          id="recu-motif"
          value={form.motif}
          onChange={(e) => onFieldChange("motif", e.target.value)}
          placeholder="Ex. Frais de prestation de transit"
          className="h-10"
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
            value={form.somme}
            onChange={(e) => onFieldChange("somme", e.target.value)}
            className="h-10"
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
            value={form.montantPaye}
            onChange={(e) => onFieldChange("montantPaye", e.target.value)}
            className={cn("h-10", montantPayeDepasseSomme && "border-red-400 focus-visible:ring-red-400")}
          />
          {montantPayeDepasseSomme ? (
            <p className="text-xs text-red-600 dark:text-red-400">Ne peut pas dépasser la somme totale.</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reste</p>
          <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatFCFA(reste)}</p>
        </div>
        <Badge variant="outline" className={cn("font-normal", STATUT_BADGE_CLASS[statut])}>
          {STATUT_LABELS[statut]}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recu-date">Date</Label>
        <Input
          id="recu-date"
          type="date"
          value={form.date}
          onChange={(e) => onFieldChange("date", e.target.value)}
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label>Signature</Label>
        <SignaturePad value={form.signature} onChange={onSignatureChange} />
      </div>
    </div>
  );
}
