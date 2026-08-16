"use client";

import { AlertTriangle, Radio, Ruler } from "lucide-react";
import type { RecuPaiementModuleData } from "@/lib/export";
import {
  RECEIPT_BLUE,
  RECEIPT_FORMAT_LABEL,
  RECEIPT_HEIGHT_MM,
  RECEIPT_PADDING_H_MM,
  RECEIPT_PADDING_V_MM,
  RECEIPT_PAPER,
  RECEIPT_WIDTH_MM,
} from "@/lib/recus-paiement-styles";
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
  fitContainer?: boolean;
  scale?: number;
}

/** Bandeau format carnet — rappelle que l'impression n'est pas A4. */
function FormatBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[#1e4a8a]/20 bg-[#dce8f5]/80 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-[#1e4a8a] dark:border-[#1e4a8a]/30 dark:bg-primary/15 dark:text-primary",
        className,
      )}
    >
      <Ruler className="size-2.5 shrink-0" aria-hidden />
      {RECEIPT_FORMAT_LABEL} · Paysage
    </span>
  );
}

/** Feuille carnet — dimensions exactes pour WYSIWYG impression. */
function ReceiptPaper({
  id,
  data,
  brand,
}: {
  id: string;
  data: RecuPaiementModuleData;
  brand: SocieteBrand;
}) {
  return (
    <div
      id={id}
      className="recu-print-target relative flex flex-col print:shadow-none"
      style={{
        width: `${RECEIPT_WIDTH_MM}mm`,
        minWidth: `${RECEIPT_WIDTH_MM}mm`,
        height: `${RECEIPT_HEIGHT_MM}mm`,
        minHeight: `${RECEIPT_HEIGHT_MM}mm`,
        maxWidth: "none",
        background: RECEIPT_PAPER,
        padding: `${RECEIPT_PADDING_V_MM}mm ${RECEIPT_PADDING_H_MM}mm`,
        color: RECEIPT_BLUE,
      }}
    >
      {/* Perforation gauche — effet carnet */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3mm] border-r border-dashed border-[#1e4a8a]/15"
        aria-hidden
      />
      <RecuReceiptHeader brand={brand} />
      <RecuReceiptBody data={data} className="flex-1" />
    </div>
  );
}

/** Aperçu React WYSIWYG — reçu horizontal (paysage) fidèle au carnet papier. */
export function RecuReceiptPreview({
  data,
  brand,
  reference,
  id = "recu-print-root",
  className,
  fitContainer = false,
  scale = 0.92,
}: RecuReceiptPreviewProps) {
  if (!brand) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-300/60 bg-amber-50/40 px-6 py-16 text-center dark:border-amber-800/50 dark:bg-amber-950/20",
          className,
        )}
      >
        <AlertTriangle className="size-8 text-amber-500" />
        <p className="text-sm font-medium text-foreground">Aperçu indisponible</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Configurez la société transit dans Paramètres &gt; Sociétés pour afficher le logo et l&apos;identité sur le reçu.
        </p>
      </div>
    );
  }

  const paper = <ReceiptPaper id={id} data={data} brand={brand} />;

  const paperFrame = (
    <div
      className="relative rounded-sm shadow-[0_8px_30px_rgba(30,74,138,0.14),0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-[#1e4a8a]/12"
      style={{ transform: `scale(${scale})`, transformOrigin: fitContainer ? "center center" : "top center" }}
    >
      {paper}
    </div>
  );

  if (fitContainer) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100/80 via-slate-150/50 to-slate-200/60 dark:from-card/80 dark:via-muted/40 dark:to-background/60",
          className,
        )}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border/50 px-3 py-2 text-xs">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium text-foreground/90">Aperçu carnet</span>
          <FormatBadge />
          {reference ? (
            <>
              <span className="text-slate-300 text-muted-foreground">·</span>
              <Radio className="size-3 text-primary" aria-hidden />
              <span className="font-mono tracking-wide text-muted-foreground">{reference}</span>
            </>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
          {paperFrame}
        </div>

        <div className="shrink-0 border-t border-border/40 bg-muted/20 px-3 py-1.5 text-center text-[10px] text-muted-foreground">
          L&apos;impression utilise le format {RECEIPT_FORMAT_LABEL} paysage — pas A4
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-slate-100/80 to-slate-200/50 shadow-sm dark:from-card/80 dark:to-background/60",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-foreground">Aperçu carnet</span>
          <FormatBadge />
        </div>
      </div>

      {reference ? (
        <div className="flex items-center justify-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2">
          <Radio className="size-3 text-primary" aria-hidden />
          <p className="font-mono text-xs tracking-wide text-muted-foreground">{reference}</p>
        </div>
      ) : null}

      <div className="overflow-x-auto p-4 sm:p-6">
        <div className="mx-auto w-fit">{paperFrame}</div>
      </div>

      <div className="border-t border-border/40 bg-muted/20 px-4 py-2 text-center text-[11px] text-muted-foreground">
        Format {RECEIPT_FORMAT_LABEL} paysage — impression personnalisée, pas A4
      </div>
    </div>
  );
}
