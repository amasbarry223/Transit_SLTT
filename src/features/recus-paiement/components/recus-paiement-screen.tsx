"use client";

import { useCallback, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RecuGeneratorActions } from "./recus-paiement/recu-generator-actions";
import { RecuGeneratorForm } from "./recus-paiement/recu-generator-form";
import { RecuReceiptPreview } from "./recus-paiement/recu-receipt-preview";
import { RecuWorkspace } from "./recus-paiement/recu-workspace";
import { useRecuGenerator } from "./recus-paiement/use-recu-generator";

export function RecusPaiementScreen() {
  const gen = useRecuGenerator();
  const { toast } = useToast();
  const [showPreviewMobile, setShowPreviewMobile] = useState(true);

  const handleSave = useCallback(async () => {
    const saved = await gen.handleSave();
    if (!saved) return;
    toast({
      title: "Reçu enregistré",
      description: `${saved.reference} — ${saved.beneficiaire} (${formatFCFA(saved.montantPaye)})`,
      variant: "success",
      action: (
        <ToastAction altText="Imprimer le reçu" onClick={() => void gen.printModuleData(saved.moduleData)}>
          Imprimer
        </ToastAction>
      ),
    });
  }, [gen, toast]);

  return (
    <>
      {/* Desktop: full viewport workspace, no scroll */}
      <div className="hidden h-full min-h-0 lg:block">
        <RecuWorkspace
          form={gen.form}
          previewReference={gen.previewReference}
          reste={gen.reste}
          statut={gen.statut}
          somme={gen.somme}
          montantPaye={gen.montantPaye}
          montantPayeDepasseSomme={gen.montantPayeDepasseSomme}
          moduleData={gen.moduleData}
          brand={gen.brand}
          lastSaved={gen.lastSaved}
          canWrite={gen.canWrite}
          submitting={gen.submitting}
          printing={gen.printing}
          onFieldChange={gen.updateField}
          onSignatureChange={gen.setSignature}
          onSave={handleSave}
          onPrint={gen.handlePrint}
          onDownloadPdf={gen.handleDownloadPdf}
          onReset={gen.resetForm}
        />
      </div>

      {/* Mobile: stacked scrollable layout */}
      <div className="space-y-4 pb-8 lg:hidden">
        <Button variant="outline" className="w-full justify-center gap-2" onClick={() => setShowPreviewMobile((v) => !v)}>
          {showPreviewMobile ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {showPreviewMobile ? "Masquer l'aperçu" : "Afficher l'aperçu du reçu"}
        </Button>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <RecuGeneratorForm
            form={gen.form}
            previewReference={gen.previewReference}
            reste={gen.reste}
            statut={gen.statut}
            somme={gen.somme}
            montantPaye={gen.montantPaye}
            montantPayeDepasseSomme={gen.montantPayeDepasseSomme}
            onFieldChange={gen.updateField}
            onSignatureChange={gen.setSignature}
          />
        </div>

        <div className={cn(showPreviewMobile ? "block" : "hidden")}>
          <RecuReceiptPreview data={gen.moduleData} brand={gen.brand} reference={gen.previewReference} />
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <RecuGeneratorActions
            canWrite={gen.canWrite}
            submitting={gen.submitting}
            printing={gen.printing}
            onSave={handleSave}
            onPrint={gen.handlePrint}
            onDownloadPdf={gen.handleDownloadPdf}
            onReset={gen.resetForm}
          />
        </div>
      </div>
    </>
  );
}
