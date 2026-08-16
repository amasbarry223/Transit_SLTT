"use client";

import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import type { RecuPaiementStatut } from "@/lib/domain-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RecuGeneratorActions } from "./recu-generator-actions";
import { RecuGeneratorForm } from "./recu-generator-form";
import { RecuReceiptPreview } from "./recu-receipt-preview";
import type { LastSavedRecu, RecuGeneratorFormState } from "./use-recu-generator";
import { useRecuPreviewScale } from "./use-recu-preview-scale";
import type { RecuPaiementModuleData } from "@/lib/export";
import type { SocieteBrand } from "@/lib/societe-brand";

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

interface RecuWorkspaceProps {
  form: RecuGeneratorFormState;
  previewReference: string;
  reste: number;
  statut: RecuPaiementStatut;
  somme: number;
  montantPaye: number;
  montantPayeDepasseSomme: boolean;
  moduleData: RecuPaiementModuleData;
  brand: SocieteBrand | null;
  lastSaved: LastSavedRecu | null;
  canWrite: boolean;
  submitting: boolean;
  printing: boolean;
  onFieldChange: <K extends keyof RecuGeneratorFormState>(key: K, value: RecuGeneratorFormState[K]) => void;
  onSignatureChange: (signature: string | null) => void;
  onSave: () => void | Promise<void>;
  onPrint: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
  onReset: () => void;
}

export function RecuWorkspace({
  form,
  previewReference,
  reste,
  statut,
  somme,
  montantPaye,
  montantPayeDepasseSomme,
  moduleData,
  brand,
  lastSaved,
  canWrite,
  submitting,
  printing,
  onFieldChange,
  onSignatureChange,
  onSave,
  onPrint,
  onDownloadPdf,
  onReset,
}: RecuWorkspaceProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const scale = useRecuPreviewScale(previewContainerRef);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/50 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-mono text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
            {previewReference}
          </span>
          <Badge variant="outline" className={cn("text-[11px] font-medium", STATUT_BADGE_CLASS[statut])}>
            {STATUT_LABELS[statut]}
          </Badge>
          {lastSaved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="size-3 shrink-0" aria-hidden />
              <span className="truncate">
                Dernier : <strong className="font-mono">{lastSaved.reference}</strong>
                {" · "}
                {formatFCFA(lastSaved.montantPaye)}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Split grid */}
      <div className="grid min-h-0 flex-1 grid-cols-[38%_62%] overflow-hidden">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-border/60 bg-card/30">
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-3 sm:px-5">
            <RecuGeneratorForm
              compact
              form={form}
              previewReference={previewReference}
              reste={reste}
              statut={statut}
              somme={somme}
              montantPaye={montantPaye}
              montantPayeDepasseSomme={montantPayeDepasseSomme}
              onFieldChange={onFieldChange}
              onSignatureChange={onSignatureChange}
            />
          </div>
        </div>

        <div ref={previewContainerRef} className="min-h-0 overflow-hidden bg-muted/20 p-3">
          <RecuReceiptPreview
            data={moduleData}
            brand={brand}
            reference={previewReference}
            fitContainer
            scale={scale}
            className="h-full border-0 shadow-none"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-border/60 bg-card/80 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <RecuGeneratorActions
          variant="toolbar"
          canWrite={canWrite}
          submitting={submitting}
          printing={printing}
          onSave={onSave}
          onPrint={onPrint}
          onDownloadPdf={onDownloadPdf}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
