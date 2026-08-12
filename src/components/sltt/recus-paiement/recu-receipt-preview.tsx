"use client";

import { AlertTriangle, Maximize2, Radio } from "lucide-react";
import type { RecuPaiementModuleData } from "@/lib/export";
import { RECEIPT_HEIGHT_MM, RECEIPT_PAPER, RECEIPT_WIDTH_MM } from "@/lib/recus-paiement-styles";
import type { SocieteBrand } from "@/lib/societe-brand";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RecuReceiptBody } from "./recu-receipt-body";
import { RecuReceiptHeader } from "./recu-receipt-header";

interface RecuReceiptPreviewProps {
  data: RecuPaiementModuleData;
  brand: SocieteBrand | null;
  reference?: string;
  id?: string;
  className?: string;
}

/** Aperçu React WYSIWYG — reçu horizontal (paysage) fidèle au carnet papier. */
export function RecuReceiptPreview({ data, brand, reference, id = "recu-print-root", className }: RecuReceiptPreviewProps) {
  if (!brand) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-300/60 bg-amber-50/40 px-6 py-16 text-center dark:border-amber-800/50 dark:bg-amber-950/20",
          className,
        )}
      >
        <AlertTriangle className="size-8 text-amber-500" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Aperçu indisponible</p>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Configurez la société transit dans Paramètres &gt; Sociétés pour afficher le logo et l&apos;identité sur le reçu.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-slate-100/80 to-slate-200/50 shadow-sm dark:from-slate-900/60 dark:to-slate-950/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Aperçu en direct</span>
          <Badge variant="secondary" className="hidden text-[10px] font-normal sm:inline-flex">
            Format horizontal
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Maximize2 className="size-3.5" aria-hidden />
          {RECEIPT_WIDTH_MM} × {RECEIPT_HEIGHT_MM} mm
        </div>
      </div>

      {reference ? (
        <div className="flex items-center justify-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2">
          <Radio className="size-3 text-primary" aria-hidden />
          <p className="font-mono text-xs tracking-wide text-slate-600 dark:text-slate-300">{reference}</p>
        </div>
      ) : null}

      <div className="overflow-x-auto p-4 sm:p-6">
        <div className="mx-auto w-fit">
          <div
            className="rounded-sm shadow-[0_8px_30px_rgba(30,74,138,0.12),0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-[#1e4a8a]/10"
            style={{ transform: "scale(0.92)", transformOrigin: "top center" }}
          >
            <div
              id={id}
              className="recu-print-target flex flex-col print:shadow-none"
              style={{
                width: `${RECEIPT_WIDTH_MM}mm`,
                minWidth: `${RECEIPT_WIDTH_MM}mm`,
                height: `${RECEIPT_HEIGHT_MM}mm`,
                minHeight: `${RECEIPT_HEIGHT_MM}mm`,
                maxWidth: "none",
                background: RECEIPT_PAPER,
                padding: "8mm 10mm",
                color: "#1e4a8a",
              }}
            >
              <RecuReceiptHeader brand={brand} />
              <RecuReceiptBody data={data} className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
