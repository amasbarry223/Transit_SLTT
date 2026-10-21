"use client";

import { BookOpen, PenLine } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { RecuGeneratorActions } from "./recus-paiement/recu-generator-actions";
import { RecuReceiptPreview } from "./recus-paiement/recu-receipt-preview";
import { RecuWorkspace } from "./recus-paiement/recu-workspace";
import { useRecuGenerator } from "./recus-paiement/use-recu-generator";

/**
 * Gestion des reçus de paiement — double usage :
 * 1. Saisie directe d'un reçu (Nom, Prénom, Montants, Motif, Date) avec impression immédiate.
 * 2. Carnet de reçus vierges numérotés pour impression en lot à découper.
 */
export function RecusPaiementScreen() {
  const gen = useRecuGenerator();

  return (
    <>
      {/* Desktop: workspace plein écran en 2 colonnes sans scroll global */}
      <div className="hidden h-full min-h-0 lg:block">
        <RecuWorkspace
          mode={gen.mode}
          onModeChange={gen.setMode}
          brand={gen.brand}
          canWrite={gen.canWrite}
          generating={gen.generating}
          printing={gen.printing}
          form={gen.form}
          onFormFieldChange={gen.updateFormField}
          savedRecu={gen.savedRecu}
          sommeLettres={gen.sommeLettres}
          reste={gen.reste}
          statut={gen.statut}
          onGenerateSaisie={gen.handleGenerateSaisie}
          onPrintSaisie={gen.handlePrintSaisie}
          onResetSaisie={gen.handleResetSaisie}
          batchCount={gen.batchCount}
          onBatchCountChange={gen.setBatchCount}
          batchSize={gen.batchSize}
          currentVierge={gen.currentVierge}
          onGenerateBatch={gen.handleGenerateBatch}
          onPrintBatch={gen.handlePrintBatch}
          activeModuleData={gen.activeModuleData}
        />
      </div>

      {/* Mobile: aperçu + actions empilés */}
      <div className="space-y-4 pb-8 lg:hidden">
        {/* Sélecteur de mode mobile */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 border border-border/50 text-xs">
          <button
            type="button"
            onClick={() => gen.setMode("saisie")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all",
              gen.mode === "saisie"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <PenLine className="size-3.5" />
            Saisie directe
          </button>
          <button
            type="button"
            onClick={() => gen.setMode("vierge")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all",
              gen.mode === "vierge"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BookOpen className="size-3.5" />
            Carnet vierge
          </button>
        </div>

        {/* Aperçu du document */}
        <RecuReceiptPreview
          data={gen.activeModuleData}
          brand={gen.brand}
          reference={gen.activeModuleData.reference}
          editable={gen.mode === "saisie" && !gen.savedRecu}
          onFieldChange={gen.updateFormField}
          montantPayeInput={gen.form.montantPaye}
        />

        {gen.mode === "vierge" && gen.batchSize > 1 && (
          <p className="text-center text-[11px] text-muted-foreground">
            Aperçu du dernier reçu du lot ({gen.batchSize} reçus vierges au total)
          </p>
        )}

        {/* Panneau d'actions et formulaire mobile */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <RecuGeneratorActions
            mode={gen.mode}
            variant="default"
            canWrite={gen.canWrite}
            generating={gen.generating}
            printing={gen.printing}
            form={gen.form}
            onFormFieldChange={gen.updateFormField}
            savedRecu={gen.savedRecu}
            sommeLettres={gen.sommeLettres}
            reste={gen.reste}
            statut={gen.statut}
            onGenerateSaisie={gen.handleGenerateSaisie}
            onPrintSaisie={gen.handlePrintSaisie}
            onResetSaisie={gen.handleResetSaisie}
            batchCount={gen.batchCount}
            onBatchCountChange={gen.setBatchCount}
            hasBatchCurrent={!!gen.currentVierge}
            onGenerateBatch={gen.handleGenerateBatch}
            onPrintBatch={gen.handlePrintBatch}
          />
        </div>
      </div>
    </>
  );
}
