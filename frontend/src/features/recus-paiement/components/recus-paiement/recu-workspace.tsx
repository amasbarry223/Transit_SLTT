"use client";

import { useRef } from "react";
import { BookOpen, FileText, PenLine, Radio, Ruler, Sparkles } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import { cn } from "@/shared/utils/cn";
import { RecuGeneratorActions } from "./recu-generator-actions";
import { RecuReceiptPreview } from "./recu-receipt-preview";
import type { GeneratedRecu, RecuMode, SaisieForm } from "./use-recu-generator";
import { useRecuPreviewScale } from "./use-recu-preview-scale";
import type { RecuPaiementModuleData } from "@/lib/export";
import type { SocieteBrand } from "@/lib/societe-brand";
import type { RecuPaiementStatut } from "@/lib/domain-types";

export interface RecuWorkspaceProps {
  mode: RecuMode;
  onModeChange: (mode: RecuMode) => void;
  brand: SocieteBrand | null;
  canWrite: boolean;
  generating: boolean;
  printing: boolean;
  // Saisie directe
  form: SaisieForm;
  onFormFieldChange: (field: keyof SaisieForm, value: string) => void;
  savedRecu: GeneratedRecu | null;
  sommeLettres: string;
  reste: number;
  statut: RecuPaiementStatut;
  onGenerateSaisie: () => unknown;
  onPrintSaisie: () => unknown;
  onResetSaisie: () => void;
  // Carnet vierge
  batchCount: number;
  onBatchCountChange: (count: number) => void;
  batchSize: number;
  currentVierge: GeneratedRecu | null;
  onGenerateBatch: () => unknown;
  onPrintBatch: () => unknown;
  // Aperçu
  activeModuleData: RecuPaiementModuleData;
}

function RecuSidebar({
  mode,
  onModeChange,
  canWrite,
  generating,
  printing,
  form,
  onFormFieldChange,
  savedRecu,
  sommeLettres,
  reste,
  statut,
  onGenerateSaisie,
  onPrintSaisie,
  onResetSaisie,
  batchCount,
  onBatchCountChange,
  batchSize,
  currentVierge,
  onGenerateBatch,
  onPrintBatch,
}: Omit<RecuWorkspaceProps, "brand" | "activeModuleData">) {
  return (
    <aside className="flex w-[350px] shrink-0 flex-col border-r border-border/60 bg-card/50">
      {/* En-tête de l'outil */}
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1e4a8a]/10 text-[#1e4a8a] dark:bg-primary/15 dark:text-primary">
          <FileText className="size-4.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-foreground">Carnet de reçus</h1>
          <p className="truncate text-xs text-muted-foreground">Saisie directe & Carnet vierge</p>
        </div>
      </div>

      {/* Sélecteur de mode (Saisie directe / Carnet vierge) */}
      <div className="border-b border-border/60 bg-muted/20 px-5 py-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 border border-border/50 text-xs">
          <button
            type="button"
            onClick={() => onModeChange("saisie")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all",
              mode === "saisie"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <PenLine className="size-3.5" />
            Saisie directe
          </button>
          <button
            type="button"
            onClick={() => onModeChange("vierge")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all",
              mode === "vierge"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BookOpen className="size-3.5" />
            Carnet vierge
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {mode === "vierge" && (
          <div className="mb-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {batchSize > 1 ? "Derniers numéros réservés" : "Dernier numéro réservé"}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="relative flex size-1.5 shrink-0">
                {currentVierge && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
                <span
                  className={cn(
                    "relative inline-flex size-1.5 rounded-full",
                    currentVierge ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                />
              </span>
              <span
                className={cn(
                  "truncate font-mono text-lg font-semibold tracking-wide",
                  currentVierge ? "text-foreground" : "text-muted-foreground/60",
                )}
              >
                {currentVierge ? currentVierge.reference : "—"}
              </span>
            </div>
            {batchSize > 1 && (
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Lot de {batchSize} reçus identiques (numéros différents), tous imprimés ensemble.
              </p>
            )}
            <div className="mt-2.5 flex items-center gap-1.5">
              <Ruler className="size-3 shrink-0 text-[#1e4a8a] dark:text-primary" aria-hidden />
              <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
                {RECEIPT_FORMAT_LABEL} · Paysage
              </span>
            </div>
          </div>
        )}

        {/* Actions & formulaire de saisie */}
        <RecuGeneratorActions
          mode={mode}
          variant="sidebar"
          canWrite={canWrite}
          generating={generating}
          printing={printing}
          form={form}
          onFormFieldChange={onFormFieldChange}
          savedRecu={savedRecu}
          sommeLettres={sommeLettres}
          reste={reste}
          statut={statut}
          onGenerateSaisie={onGenerateSaisie}
          onPrintSaisie={onPrintSaisie}
          onResetSaisie={onResetSaisie}
          batchCount={batchCount}
          onBatchCountChange={onBatchCountChange}
          hasBatchCurrent={!!currentVierge}
          onGenerateBatch={onGenerateBatch}
          onPrintBatch={onPrintBatch}
        />
      </div>

      <div className="shrink-0 border-t border-border/40 px-5 py-3 text-[11px] leading-snug text-muted-foreground">
        L&apos;impression utilise le format {RECEIPT_FORMAT_LABEL} paysage — personnalisé pour carnet souche.
      </div>
    </aside>
  );
}

export function RecuWorkspace({
  mode,
  onModeChange,
  brand,
  canWrite,
  generating,
  printing,
  form,
  onFormFieldChange,
  savedRecu,
  sommeLettres,
  reste,
  statut,
  onGenerateSaisie,
  onPrintSaisie,
  onResetSaisie,
  batchCount,
  onBatchCountChange,
  batchSize,
  currentVierge,
  onGenerateBatch,
  onPrintBatch,
  activeModuleData,
}: RecuWorkspaceProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const scale = useRecuPreviewScale(previewContainerRef);

  return (
    <div className="flex h-full min-h-0">
      <RecuSidebar
        mode={mode}
        onModeChange={onModeChange}
        canWrite={canWrite}
        generating={generating}
        printing={printing}
        form={form}
        onFormFieldChange={onFormFieldChange}
        savedRecu={savedRecu}
        sommeLettres={sommeLettres}
        reste={reste}
        statut={statut}
        onGenerateSaisie={onGenerateSaisie}
        onPrintSaisie={onPrintSaisie}
        onResetSaisie={onResetSaisie}
        batchCount={batchCount}
        onBatchCountChange={onBatchCountChange}
        batchSize={batchSize}
        currentVierge={currentVierge}
        onGenerateBatch={onGenerateBatch}
        onPrintBatch={onPrintBatch}
      />

      {/* Canevas — la feuille WYSIWYG centrée */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100/70 via-slate-150/40 to-slate-200/50 dark:from-card/60 dark:via-muted/30 dark:to-background/50",
        )}
      >
        <div className="flex shrink-0 justify-center px-4 pt-3.5">
          {mode === "saisie" ? (
            savedRecu ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm">
                <Radio className="size-3 text-emerald-500" aria-hidden />
                Reçu {savedRecu.reference} enregistré — Prêt à imprimer
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-card/90 px-3.5 py-1 text-[11px] font-medium text-foreground shadow-sm">
                <Sparkles className="size-3 text-primary" aria-hidden />
                Saisie directe : remplissez les champs à gauche ou directement sur la feuille ci-dessous
              </span>
            )
          ) : !currentVierge ? (
            <span className="rounded-full border border-border/60 bg-card/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
              Carnet vierge — réservez un numéro pour l&apos;imprimer
            </span>
          ) : batchSize > 1 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-card/90 px-3 py-1 text-[11px] font-medium text-primary shadow-sm">
              <Radio className="size-3" aria-hidden />
              Aperçu du dernier reçu vierge du lot ({batchSize} au total)
            </span>
          ) : null}
        </div>

        <div ref={previewContainerRef} className="min-h-0 flex-1 overflow-hidden p-4">
          <RecuReceiptPreview
            data={activeModuleData}
            brand={brand}
            reference={activeModuleData.reference}
            fitContainer
            bare
            scale={scale}
            editable={mode === "saisie" && !savedRecu}
            onFieldChange={onFormFieldChange}
            montantPayeInput={form.montantPaye}
            className="h-full border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
