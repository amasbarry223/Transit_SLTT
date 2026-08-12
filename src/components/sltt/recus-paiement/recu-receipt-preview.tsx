"use client";

import { AlertTriangle } from "lucide-react";
import type { RecuPaiementModuleData } from "@/lib/export";
import { RECEIPT_HEIGHT_MM, RECEIPT_PAPER, RECEIPT_WIDTH_MM } from "@/lib/recus-paiement-styles";
import type { SocieteBrand } from "@/lib/societe-brand";
import { cn } from "@/lib/utils";
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
      <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 px-6 py-16 text-center", className)}>
        <AlertTriangle className="size-8 text-amber-500" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Aperçu indisponible</p>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Configurez la société transit dans Paramètres &gt; Sociétés.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-[#eef2f7] p-3 shadow-sm sm:p-4", className)}>
      {reference ? (
        <p className="mb-2 text-center font-mono text-xs text-slate-500 dark:text-slate-400">{reference}</p>
      ) : null}
      <div className="overflow-x-auto pb-1">
        <div
          id={id}
          className="recu-print-target mx-auto flex flex-col print:shadow-none"
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
  );
}
