"use client";

import { ScanText, ArrowLeft, Info } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useOcrReviewState,
  OcrReviewFields,
  OcrReviewActions,
} from "@/components/sltt/documents/ocr-review-dialog";

/**
 * Page complète pour la validation OCR du flux "Nouveau dossier via OCR" —
 * remplace la modale (qui pouvait déborder sur un document + formulaire
 * chargés) par une page dédiée, même contenu que `OcrReviewDialog` (logique
 * partagée via `useOcrReviewState`). La relance OCR depuis la fiche d'un
 * dossier existant reste une modale (contexte différent, cf. plan).
 */
export function DossierOcrReviewScreen() {
  const selectedId = useNav((s) => s.selectedId);
  const go = useNav((s) => s.go);

  const state = useOcrReviewState({
    open: true,
    onOpenChange: (v) => {
      if (!v) go("dossiers");
    },
    documentId: selectedId,
  });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="-ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        onClick={() => go("dossiers")}
      >
        <ArrowLeft className="size-4" />
        Retour à la liste
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ScanText className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Validation OCR</h1>
          <p className="text-sm text-muted-foreground">
            Vérifiez les champs extraits avant d&apos;enregistrer. Les champs incertains sont
            surlignés en ambre.
          </p>
        </div>
      </div>

      {!state.doc ? (
        <Card className="flex flex-col items-center gap-3 border-border/80 p-10 text-center shadow-sm">
          <Info className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Document introuvable — retournez à la liste et réessayez l&apos;import.
          </p>
        </Card>
      ) : (
        <Card className="flex max-h-[75vh] flex-col gap-0 overflow-hidden p-0 shadow-sm">
          <OcrReviewFields state={state} />
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <OcrReviewActions state={state} onCancel={() => go("dossiers")} cancelLabel="Retour à la liste" />
      </div>
    </div>
  );
}
