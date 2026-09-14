"use client";

import { useRef } from "react";
import { FileText, Radio, Ruler } from "lucide-react";
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
  batchSize: number;
  brand: SocieteBrand | null;
  canWrite: boolean;
  count: number;
  onCountChange: (value: number) => void;
  generating: boolean;
  printing: boolean;
  onGenerate: () => unknown;
  onPrint: () => unknown;
}

/** Panneau latéral gauche : identité de l'outil, état du dernier reçu
 *  réservé, puis les actions. Regroupe tout ce sur quoi l'utilisateur agit
 *  ou doit garder un œil, pour ne plus le faire naviguer entre une barre en
 *  haut et une barre en bas de l'écran. */
function RecuSidebar({
  current,
  batchSize,
  canWrite,
  count,
  onCountChange,
  generating,
  printing,
  onGenerate,
  onPrint,
}: Omit<RecuWorkspaceProps, "brand">) {
  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-r border-border/60 bg-card/40">
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1e4a8a]/10 text-[#1e4a8a] dark:bg-primary/15 dark:text-primary">
          <FileText className="size-4.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-foreground">Carnet de reçus</h1>
          <p className="truncate text-xs text-muted-foreground">Numéros vierges à imprimer</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* État du dernier numéro réservé */}
        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {batchSize > 1 ? "Derniers numéros réservés" : "Dernier numéro réservé"}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="relative flex size-1.5 shrink-0">
              {current && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span className={cn("relative inline-flex size-1.5 rounded-full", current ? "bg-emerald-500" : "bg-muted-foreground/40")} />
            </span>
            <span className={cn("truncate font-mono text-lg font-semibold tracking-wide", current ? "text-foreground" : "text-muted-foreground/60")}>
              {current ? current.reference : "—"}
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

        <div className="my-5 h-px bg-border/60" />

        <RecuGeneratorActions
          variant="sidebar"
          canWrite={canWrite}
          hasCurrent={!!current}
          count={count}
          onCountChange={onCountChange}
          generating={generating}
          printing={printing}
          onGenerate={onGenerate}
          onPrint={onPrint}
        />
      </div>

      <div className="shrink-0 border-t border-border/40 px-5 py-3 text-[11px] leading-snug text-muted-foreground">
        L&apos;impression utilise le format {RECEIPT_FORMAT_LABEL} paysage — pas A4.
      </div>
    </aside>
  );
}

export function RecuWorkspace({
  current,
  batchSize,
  brand,
  canWrite,
  count,
  onCountChange,
  generating,
  printing,
  onGenerate,
  onPrint,
}: RecuWorkspaceProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const scale = useRecuPreviewScale(previewContainerRef);

  return (
    <div className="flex h-full min-h-0">
      <RecuSidebar
        current={current}
        batchSize={batchSize}
        canWrite={canWrite}
        count={count}
        onCountChange={onCountChange}
        generating={generating}
        printing={printing}
        onGenerate={onGenerate}
        onPrint={onPrint}
      />

      {/* Canevas — la feuille WYSIWYG centrée, vierge tant qu'aucun reçu n'a
          été généré ; montre le dernier numéro du lot (les reçus d'un même
          lot sont identiques hormis leur numéro). */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100/70 via-slate-150/40 to-slate-200/50 dark:from-card/60 dark:via-muted/30 dark:to-background/50",
        )}
      >
        <div className="flex shrink-0 justify-center px-4 pt-4">
          {!current ? (
            <span className="rounded-full border border-border/60 bg-card/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
              Aucun reçu généré — réservez un numéro pour l&apos;imprimer
            </span>
          ) : batchSize > 1 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-card/90 px-3 py-1 text-[11px] font-medium text-primary shadow-sm">
              <Radio className="size-3" aria-hidden />
              Aperçu du dernier reçu du lot ({batchSize} au total)
            </span>
          ) : null}
        </div>
        <div ref={previewContainerRef} className="min-h-0 flex-1 overflow-hidden p-4">
          <RecuReceiptPreview
            data={current?.moduleData ?? BLANK_MODULE_DATA}
            brand={brand}
            reference={current?.reference}
            fitContainer
            bare
            scale={scale}
            className={cn("h-full border-0 shadow-none", !current && "opacity-60")}
          />
        </div>
      </div>
    </div>
  );
}
