"use client";

import { useRef, type ReactNode } from "react";
import { Eye, PenLine, Ruler } from "lucide-react";
import { RECEIPT_FORMAT_LABEL } from "@/lib/recus-paiement-styles";
import { cn } from "@/shared/utils/cn";
import { RecuGeneratorActions } from "./recu-generator-actions";
import { RecuModeToggle } from "./recu-mode-toggle";
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

type ChipTone = "neutral" | "draft" | "success";

const CHIP_TONES: Record<ChipTone, { chip: string; dot: string }> = {
  neutral: { chip: "border-border/60 bg-muted/40 text-muted-foreground", dot: "bg-muted-foreground/40" },
  draft: { chip: "border-primary/25 bg-primary/5 text-foreground", dot: "bg-primary" },
  success: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

function StatusChip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  const t = CHIP_TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        t.chip,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", t.dot)} aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Coque commune aux deux colonnes : même en-tête, même bandeau d'outils,
 *  même pied — c'est ce qui rend les deux panneaux visuellement égaux,
 *  pas seulement leur largeur. */
function Panel({
  icon,
  title,
  subtitle,
  aside,
  toolbar,
  footer,
  bodyClassName,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  aside?: ReactNode;
  toolbar: ReactNode;
  footer: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1e4a8a]/10 text-[#1e4a8a] dark:bg-primary/15 dark:text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {aside ? <div className="min-w-0 shrink">{aside}</div> : null}
      </header>
      <div className="flex h-14 shrink-0 items-center border-b border-border/40 bg-muted/20 px-5">{toolbar}</div>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>
        {children}
      </div>
      <footer className="flex h-10 shrink-0 items-center gap-1.5 border-t border-border/40 px-5 text-[11px] text-muted-foreground">
        {footer}
      </footer>
    </section>
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
  const busy = generating || printing;

  const documentChip =
    mode === "saisie" ? (
      savedRecu ? (
        <StatusChip tone="success">N° {savedRecu.reference} enregistré</StatusChip>
      ) : (
        <StatusChip tone="draft">Brouillon</StatusChip>
      )
    ) : currentVierge ? (
      <StatusChip tone="success">
        {batchSize > 1 ? `${batchSize} numéros réservés` : `N° ${currentVierge.reference}`}
      </StatusChip>
    ) : (
      <StatusChip tone="neutral">Aucun numéro réservé</StatusChip>
    );

  const previewHint =
    mode === "saisie"
      ? savedRecu
        ? "Reçu figé — imprimez-le ou préparez un nouveau reçu."
        : "Cliquez directement sur la feuille pour la remplir."
      : !currentVierge
        ? "Réservez un numéro pour afficher le reçu à imprimer."
        : batchSize > 1
          ? `Dernier reçu du lot (${currentVierge.reference}) — ${batchSize} pages à l'impression.`
          : "Reçu vierge prêt à imprimer, à remplir au stylo.";

  return (
    <div className="grid h-full min-h-0 grid-cols-2 gap-5 p-5">
      {/* Colonne gauche — saisie */}
      <Panel
        icon={<PenLine className="size-4.5" aria-hidden />}
        title="Reçu de paiement"
        subtitle={mode === "saisie" ? "Informations du règlement" : "Carnet de reçus numérotés"}
        aside={documentChip}
        toolbar={<RecuModeToggle mode={mode} onModeChange={onModeChange} disabled={busy} className="w-full" />}
        footer={
          mode === "saisie" ? (
            <>
              Les champs marqués <span className="font-semibold text-red-500">*</span> sont obligatoires.
            </>
          ) : (
            "Chaque numéro réservé est définitif et ne sera jamais réattribué."
          )
        }
        bodyClassName="overflow-y-auto px-5 py-5"
      >
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
      </Panel>

      {/* Colonne droite — aperçu WYSIWYG */}
      <Panel
        icon={<Eye className="size-4.5" aria-hidden />}
        title="Aperçu du reçu"
        subtitle="Rendu identique à l'impression"
        aside={
          <span className="inline-flex items-center gap-1 rounded-full border border-[#1e4a8a]/20 bg-[#dce8f5]/80 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-[#1e4a8a] dark:border-[#1e4a8a]/30 dark:bg-primary/15 dark:text-primary">
            <Ruler className="size-3 shrink-0" aria-hidden />
            {RECEIPT_FORMAT_LABEL} · Paysage
          </span>
        }
        toolbar={<p className="truncate text-xs text-muted-foreground">{previewHint}</p>}
        footer={<>Impression au format {RECEIPT_FORMAT_LABEL} paysage, adapté au carnet à souche — pas A4.</>}
        bodyClassName="overflow-hidden bg-muted/30 bg-[radial-gradient(circle,_rgb(148_163_184/0.18)_1px,_transparent_1px)] [background-size:16px_16px] p-6 dark:bg-background/40"
      >
        {/* Zone mesurée sans padding : useRecuPreviewScale calcule l'échelle
            sur sa boîte, le padding du panneau fausserait l'ajustement. */}
        <div ref={previewContainerRef} className="h-full min-h-0">
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
      </Panel>
    </div>
  );
}
