"use client";

import { CheckCircle2, Clock, FilePlus2, Minus, Plus, Printer, ReceiptText, RotateCcw } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";
import type { SaisieForm, GeneratedRecu } from "./use-recu-generator";
import type { RecuPaiementStatut } from "@/lib/domain-types";
import { fmtFCFA } from "@/lib/export/print-modules/shared";

export interface RecuGeneratorActionsProps {
  mode: "saisie" | "vierge";
  canWrite: boolean;
  generating: boolean;
  printing: boolean;
  variant?: "default" | "sidebar";
  // Saisie props
  form: SaisieForm;
  onFormFieldChange: (field: keyof SaisieForm, value: string) => void;
  savedRecu: GeneratedRecu | null;
  sommeLettres: string;
  reste: number;
  statut: RecuPaiementStatut;
  onGenerateSaisie: () => unknown;
  onPrintSaisie: () => unknown;
  /** Ticket de caisse 80 mm (imprimante thermique). */
  onPrintTicket?: () => unknown;
  onResetSaisie: () => void;
  // Vierge props
  batchCount: number;
  onBatchCountChange: (value: number) => void;
  hasBatchCurrent: boolean;
  onGenerateBatch: () => unknown;
  onPrintBatch: () => unknown;
}

const COMMON_MOTIFS = [
  "Frais de prestation de transit",
  "Dédouanement marchandise",
  "Transport & Logistique",
  "Frais de magasinage",
];

function QuantityStepper({
  count,
  onCountChange,
  disabled,
  className,
}: {
  count: number;
  onCountChange: (value: number) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onCountChange(count - 1)}
        disabled={disabled || count <= 1}
        aria-label="Diminuer le nombre de reçus"
      >
        <Minus className="size-3.5" />
      </Button>
      <Input
        id="recu-count"
        type="number"
        min={1}
        max={100}
        value={count}
        onChange={(e) => onCountChange(Number(e.target.value))}
        disabled={disabled}
        className="h-8.5 w-14 text-center font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onCountChange(count + 1)}
        disabled={disabled || count >= 100}
        aria-label="Augmenter le nombre de reçus"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

export function RecuGeneratorActions({
  mode,
  canWrite,
  generating,
  printing,
  variant = "default",
  form,
  onFormFieldChange,
  savedRecu,
  sommeLettres,
  reste,
  statut,
  onGenerateSaisie,
  onPrintSaisie,
  onPrintTicket,
  onResetSaisie,
  batchCount,
  onBatchCountChange,
  hasBatchCurrent,
  onGenerateBatch,
  onPrintBatch,
}: RecuGeneratorActionsProps) {
  const busy = generating || printing;

  // -------------------------------------------------------------
  // Mode Saisie Directe
  // -------------------------------------------------------------
  if (mode === "saisie") {
    const isSaved = !!savedRecu;
    // Un reçu enregistré est figé : l'impression utilise savedRecu (valeurs
    // en base), toute modification après coup ne serait que dans l'aperçu.
    const locked = busy || isSaved;
    const dateRecu = new Date(savedRecu?.moduleData.date ?? Date.now()).toLocaleDateString("fr-FR");
    const numSomme = Number(form.somme) || 0;
    const numMontant = Number(form.montantPaye) || 0;

    return (
      <div className="flex flex-col gap-4">
        {/* Statut du document en cours — dans le workspace desktop (sidebar),
            l'en-tête du panneau porte déjà ce statut. */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition-colors",
            isSaved
              ? "border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/20"
              : "border-primary/25 bg-primary/5 dark:border-primary/20 dark:bg-primary/10",
            variant === "sidebar" && "hidden",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              {isSaved ? (
                <>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              )}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {isSaved ? `N° ${savedRecu.reference}` : "Brouillon en cours"}
            </span>
          </div>
          {isSaved && (
            <button
              type="button"
              onClick={onResetSaisie}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Préparer un nouveau reçu"
            >
              <RotateCcw className="size-3" /> Nouveau
            </button>
          )}
        </div>

        {/* Formulaire de saisie */}
        <div className="space-y-3">
          {/* Nom & Prénom */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="saisie-nom" className="text-[11px] font-medium text-muted-foreground">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="saisie-nom"
                value={form.nom}
                onChange={(e) => onFormFieldChange("nom", e.target.value)}
                placeholder="Ex: DIARRA"
                className="h-8.5 text-xs font-medium"
                disabled={locked}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="saisie-prenom" className="text-[11px] font-medium text-muted-foreground">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="saisie-prenom"
                value={form.prenom}
                onChange={(e) => onFormFieldChange("prenom", e.target.value)}
                placeholder="Ex: Awa"
                className="h-8.5 text-xs font-medium"
                disabled={locked}
              />
            </div>
          </div>

          {/* Somme due & Montant payé */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="saisie-somme" className="text-[11px] font-medium text-muted-foreground">
                Somme due (FCFA)
              </Label>
              <Input
                id="saisie-somme"
                type="number"
                min={0}
                value={form.somme}
                onChange={(e) => onFormFieldChange("somme", e.target.value)}
                placeholder="0"
                className="h-8.5 text-xs font-bold font-mono"
                disabled={locked}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="saisie-montant" className="text-[11px] font-medium text-muted-foreground">
                  Montant payé
                </Label>
                {!locked && numSomme > 0 && numMontant !== numSomme && (
                  <button
                    type="button"
                    onClick={() => onFormFieldChange("montantPaye", String(numSomme))}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Soldé
                  </button>
                )}
              </div>
              <Input
                id="saisie-montant"
                type="number"
                min={0}
                value={form.montantPaye}
                onChange={(e) => onFormFieldChange("montantPaye", e.target.value)}
                placeholder="0"
                className="h-8.5 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400"
                disabled={locked}
              />
            </div>
          </div>

          {/* Somme en toutes lettres (aperçu direct) */}
          {sommeLettres && (
            <div className="rounded-lg bg-blue-50/70 p-2 text-[11px] leading-tight text-[#1e4a8a] dark:bg-blue-950/30 dark:text-blue-300">
              <span className="font-semibold">En toutes lettres :</span> {sommeLettres}
            </div>
          )}

          {/* Indicateur de Reste & Statut */}
          {numSomme > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs">
              <span className="text-[11px] text-muted-foreground">Reste à payer :</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold">{fmtFCFA(reste)}</span>
                {statut === "SOLDE" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" /> Soldé
                  </span>
                ) : statut === "PARTIEL" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="size-3" /> Partiel
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    En attente
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Motif */}
          <div className="space-y-1.5">
            <Label htmlFor="saisie-motif" className="text-[11px] font-medium text-muted-foreground">
              Motif du règlement
            </Label>
            <Input
              id="saisie-motif"
              value={form.motif}
              onChange={(e) => onFormFieldChange("motif", e.target.value)}
              placeholder="Motif du paiement"
              className="h-8.5 text-xs"
              disabled={locked}
            />
            {/* Suggestions rapides */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {COMMON_MOTIFS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onFormFieldChange("motif", m)}
                  disabled={locked}
                  className={cn(
                    "rounded-md border border-border/60 px-2 py-0.5 text-[10px] transition-colors disabled:pointer-events-none disabled:opacity-50",
                    form.motif === m
                      ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="saisie-date" className="text-[11px] font-medium text-muted-foreground">
              Date du reçu
            </Label>
            <Input id="saisie-date" value={dateRecu} readOnly disabled className="h-8.5 text-xs font-mono" />
          </div>
        </div>

        {/* Boutons d'action Saisie */}
        <div className="flex flex-col gap-2 pt-1">
          {canWrite && !isSaved && (
            <Button
              onClick={() => void onGenerateSaisie()}
              disabled={busy}
              className="h-10 justify-center gap-2 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-md shadow-red-600/20 border border-red-500/40 transition-all text-xs"
            >
              <FilePlus2 className="size-4" />
              {generating ? "Enregistrement…" : "Générer & Enregistrer"}
            </Button>
          )}

          <Button
            variant={isSaved ? "default" : "outline"}
            onClick={() => void onPrintSaisie()}
            disabled={busy}
            className={cn(
              "h-10 justify-center gap-2 rounded-xl text-xs font-semibold",
              isSaved && "bg-[#1e4a8a] hover:bg-[#163a6f] text-white",
            )}
            title={`Impression format ${RECEIPT_FORMAT_LABEL} paysage`}
          >
            <Printer className="size-4" />
            {printing ? "Préparation…" : isSaved ? "Imprimer le reçu" : "Générer & Imprimer"}
          </Button>

          {onPrintTicket && (
            <Button
              variant="outline"
              onClick={() => void onPrintTicket()}
              disabled={busy}
              className="h-10 justify-center gap-2 rounded-xl text-xs font-semibold"
              title="Ticket de caisse pour imprimante thermique 80 mm"
            >
              <ReceiptText className="size-4" />
              {isSaved ? "Ticket de caisse (80 mm)" : "Générer & Ticket (80 mm)"}
            </Button>
          )}

          {isSaved && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetSaisie}
              disabled={busy}
              className="h-8.5 justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Nouveau reçu (+)
            </Button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Mode Carnet Vierge
  // -------------------------------------------------------------
  if (variant === "sidebar") {
    return (
      <div className="flex flex-col gap-5">
        {canWrite && (
          <div className="space-y-2">
            <Label htmlFor="recu-count" className="text-xs font-medium text-muted-foreground">
              Nombre de reçus à réserver
            </Label>
            <QuantityStepper count={batchCount} onCountChange={onBatchCountChange} disabled={busy} />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Plusieurs numéros d&apos;affilée pour un carnet à découper.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {canWrite && (
            <Button
              onClick={() => void onGenerateBatch()}
              disabled={busy}
              className="h-11 justify-center gap-2 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 transition-all text-xs"
            >
              <FilePlus2 className="size-4" />
              {generating ? "Génération…" : batchCount > 1 ? `Générer ${batchCount} reçus` : "Générer un reçu"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => void onPrintBatch()}
            disabled={busy || !hasBatchCurrent}
            className="h-11 justify-center gap-2 rounded-xl text-xs"
            title={`Impression ${RECEIPT_FORMAT_LABEL} paysage (pas A4)`}
          >
            <Printer className="size-4" />
            {printing ? "Préparation…" : "Imprimer le carnet"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Actions Carnet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Générez un ou plusieurs numéros de reçu vierges, puis imprimez-les en carnet à découper.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {canWrite && (
          <>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
              <Label htmlFor="recu-count" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Nombre de reçus
              </Label>
              <QuantityStepper count={batchCount} onCountChange={onBatchCountChange} disabled={busy} />
            </div>
            <Button
              onClick={() => void onGenerateBatch()}
              disabled={busy}
              className="h-11 justify-center gap-2 bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 transition-all text-xs"
            >
              <FilePlus2 className="size-4" />
              {generating ? "Génération…" : batchCount > 1 ? `Générer ${batchCount} reçus` : "Générer un nouveau reçu"}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => void onPrintBatch()}
          disabled={busy || !hasBatchCurrent}
          className="h-11 justify-center gap-2 rounded-xl text-xs"
          title={`Impression ${RECEIPT_FORMAT_LABEL} paysage (pas A4)`}
        >
          <Printer className="size-4" />
          {printing ? "Préparation…" : "Imprimer / Enregistrer en PDF"}
        </Button>
      </div>
    </div>
  );
}
