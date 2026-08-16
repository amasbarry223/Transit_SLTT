"use client";

import { CalendarDays, CreditCard, UserRound } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  EN_ATTENTE: "border-slate-200 text-slate-600 dark:border-border bg-muted/50 dark:text-slate-400",
};

interface RecuGeneratorFormProps {
  form: RecuGeneratorFormState;
  previewReference: string;
  reste: number;
  statut: RecuPaiementStatut;
  somme: number;
  montantPaye: number;
  montantPayeDepasseSomme: boolean;
  compact?: boolean;
  onFieldChange: <K extends keyof RecuGeneratorFormState>(key: K, value: RecuGeneratorFormState[K]) => void;
  onSignatureChange: (signature: string | null) => void;
}

function PaymentProgress({ somme, montantPaye }: { somme: number; montantPaye: number }) {
  const pct = somme > 0 ? Math.min(100, Math.round((montantPaye / somme) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Progression</span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ResteSummary({ reste, statut }: { reste: number; statut: RecuPaiementStatut }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Reste à payer</p>
        <p className="text-lg font-bold tabular-nums tracking-tight text-foreground">{formatFCFA(reste)}</p>
      </div>
      <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-medium", STATUT_BADGE_CLASS[statut])}>
        {STATUT_LABELS[statut]}
      </Badge>
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
  compact = false,
  onFieldChange,
  onSignatureChange,
}: RecuGeneratorFormProps) {
  const inputClass = compact ? "h-9 text-sm" : "h-11";
  const labelClass = compact ? "text-xs" : undefined;

  if (compact) {
    return (
      <Tabs defaultValue="identite" className="flex h-full min-h-0 flex-col gap-3">
        <TabsList className="grid h-9 w-full shrink-0 grid-cols-3" role="tablist">
          <TabsTrigger value="identite" className="gap-1.5 text-xs transition-[color,box-shadow] duration-150">
            <UserRound className="size-3.5" aria-hidden />
            Identité
          </TabsTrigger>
          <TabsTrigger value="paiement" className="gap-1.5 text-xs transition-[color,box-shadow] duration-150">
            <CreditCard className="size-3.5" aria-hidden />
            Paiement
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-1.5 text-xs transition-[color,box-shadow] duration-150">
            <CalendarDays className="size-3.5" aria-hidden />
            Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identite" className="mt-0 min-h-0 space-y-3 data-[state=inactive]:hidden">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recu-nom" className={labelClass}>
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recu-nom"
                value={form.nom}
                onChange={(e) => onFieldChange("nom", e.target.value)}
                placeholder="TRAORE"
                className={inputClass}
                autoComplete="family-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recu-prenom" className={labelClass}>
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recu-prenom"
                value={form.prenom}
                onChange={(e) => onFieldChange("prenom", e.target.value)}
                placeholder="Amadou"
                className={inputClass}
                autoComplete="given-name"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="paiement" className="mt-0 min-h-0 space-y-3 data-[state=inactive]:hidden">
          <div className="space-y-1.5">
            <Label htmlFor="recu-motif" className={labelClass}>
              Motif <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recu-motif"
              value={form.motif}
              onChange={(e) => onFieldChange("motif", e.target.value)}
              placeholder="Frais de prestation de transit"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recu-somme" className={labelClass}>
                Somme (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recu-somme"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.somme}
                onChange={(e) => onFieldChange("somme", e.target.value)}
                placeholder="100 000"
                className={cn(inputClass, "tabular-nums")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recu-montant-paye" className={labelClass}>
                Payé (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recu-montant-paye"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.montantPaye}
                onChange={(e) => onFieldChange("montantPaye", e.target.value)}
                placeholder="70 000"
                className={cn(inputClass, "tabular-nums", montantPayeDepasseSomme && "border-red-400 focus-visible:ring-red-400")}
              />
              {montantPayeDepasseSomme ? (
                <p className="text-[11px] text-red-600 dark:text-red-400">Ne peut pas dépasser la somme.</p>
              ) : null}
            </div>
          </div>

          {somme > 0 ? <PaymentProgress somme={somme} montantPaye={montantPaye} /> : null}
          <ResteSummary reste={reste} statut={statut} />
        </TabsContent>

        <TabsContent value="validation" className="mt-0 min-h-0 space-y-3 data-[state=inactive]:hidden">
          <div className="space-y-1.5">
            <Label htmlFor="recu-date" className={labelClass}>
              Date du paiement
            </Label>
            <Input
              id="recu-date"
              type="date"
              value={form.date}
              onChange={(e) => onFieldChange("date", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Signature</Label>
            <SignaturePad compact value={form.signature} onChange={onSignatureChange} />
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  /* Mobile / non-compact fallback */
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="recu-numero-mobile" className="text-xs text-slate-500">
          Référence
        </Label>
        <Input
          id="recu-numero-mobile"
          value={previewReference}
          readOnly
          className="h-9 border-dashed bg-muted/30 font-mono text-sm tracking-wide"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recu-nom-m">
            Nom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recu-nom-m"
            value={form.nom}
            onChange={(e) => onFieldChange("nom", e.target.value)}
            placeholder="TRAORE"
            className="h-9"
            autoComplete="family-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recu-prenom-m">
            Prénom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recu-prenom-m"
            value={form.prenom}
            onChange={(e) => onFieldChange("prenom", e.target.value)}
            placeholder="Amadou"
            className="h-9"
            autoComplete="given-name"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recu-motif-m">
          Motif <span className="text-red-500">*</span>
        </Label>
        <Input
          id="recu-motif-m"
          value={form.motif}
          onChange={(e) => onFieldChange("motif", e.target.value)}
          className="h-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recu-somme-m">Somme (FCFA) *</Label>
          <Input
            id="recu-somme-m"
            type="number"
            min="0"
            value={form.somme}
            onChange={(e) => onFieldChange("somme", e.target.value)}
            className="h-9 tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recu-montant-paye-m">Payé (FCFA) *</Label>
          <Input
            id="recu-montant-paye-m"
            type="number"
            min="0"
            value={form.montantPaye}
            onChange={(e) => onFieldChange("montantPaye", e.target.value)}
            className={cn("h-9 tabular-nums", montantPayeDepasseSomme && "border-red-400")}
          />
        </div>
      </div>

      {somme > 0 ? <PaymentProgress somme={somme} montantPaye={montantPaye} /> : null}
      <ResteSummary reste={reste} statut={statut} />

      <div className="space-y-1.5">
        <Label htmlFor="recu-date-m">Date</Label>
        <Input
          id="recu-date-m"
          type="date"
          value={form.date}
          onChange={(e) => onFieldChange("date", e.target.value)}
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Signature</Label>
        <SignaturePad value={form.signature} onChange={onSignatureChange} />
      </div>
    </div>
  );
}
