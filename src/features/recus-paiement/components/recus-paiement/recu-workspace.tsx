"use client";

import { useRef } from "react";
import { FileText, Ruler } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import { cn } from "@/shared/utils/cn";
import { RecuGeneratorActions } from "./recu-generator-actions";
import { RecuReceiptPreview } from "./recu-receipt-preview";
import type { GeneratedRecu } from "./use-recu-generator";
import { useRecuPreviewScale } from "./use-recu-preview-scale";
import type { RecuPaiementModuleData } from "@/lib/export";
import type { SocieteBrand } from "@/lib/societe-brand";

const BLANK_MODULE_DATA: RecuPaiementModuleData = { reference: "" };

interface RecuWorkspaceProps {
  current: GeneratedRecu | null;
  brand: SocieteBrand | null;
  canWrite: boolean;
  generating: boolean;
  printing: boolean;
  onGenerate: () => unknown;
  onPrint: () => unknown;
}

export function RecuWorkspace({
  current,
  brand,
  canWrite,
  generating,
  printing,
  onGenerate,
  onPrint,
}: RecuWorkspaceProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const scale = useRecuPreviewScale(previewContainerRef);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/50 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-[#1e4a8a]" aria-hidden />
            <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
              {current ? current.reference : "Aucun reçu généré"}
            </span>
          </div>
          <span className="hidden items-center gap-1 rounded-md border border-[#1e4a8a]/15 bg-[#dce8f5]/50 px-2 py-0.5 font-mono text-[10px] text-[#1e4a8a] sm:inline-flex dark:bg-primary/15 dark:text-primary">
            <Ruler className="size-2.5" aria-hidden />
            {RECEIPT_FORMAT_LABEL}
          </span>
        </div>
      </div>

      {/* Aperçu carnet — vierge tant qu'aucun reçu n'a été généré. */}
      <div ref={previewContainerRef} className="min-h-0 flex-1 overflow-hidden bg-muted/20 p-3">
        <RecuReceiptPreview
          data={current?.moduleData ?? BLANK_MODULE_DATA}
          brand={brand}
          reference={current?.reference}
          fitContainer
          scale={scale}
          className={cn("h-full border-0 shadow-none", !current && "opacity-60")}
        />
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-border/60 bg-card/80 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <RecuGeneratorActions
          variant="toolbar"
          canWrite={canWrite}
          hasCurrent={!!current}
          generating={generating}
          printing={printing}
          onGenerate={onGenerate}
          onPrint={onPrint}
        />
      </div>
    </div>
  );
}
