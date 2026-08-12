"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RecuGeneratorActions } from "@/components/sltt/recus-paiement/recu-generator-actions";
import { RecuGeneratorForm } from "@/components/sltt/recus-paiement/recu-generator-form";
import { RecuReceiptPreview } from "@/components/sltt/recus-paiement/recu-receipt-preview";
import { useRecuGenerator } from "@/components/sltt/recus-paiement/use-recu-generator";

export function RecusPaiementScreen() {
  const gen = useRecuGenerator();
  const [showPreviewMobile, setShowPreviewMobile] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Créer un reçu de paiement"
        description="Renseignez les informations du paiement puis prévisualisez le reçu au format horizontal."
      />

      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowPreviewMobile((v) => !v)}
        >
          {showPreviewMobile ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {showPreviewMobile ? "Masquer l'aperçu" : "Afficher l'aperçu"}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-border/80 p-5 shadow-sm sm:p-6 lg:max-w-xl">
          <RecuGeneratorForm
            form={gen.form}
            previewReference={gen.previewReference}
            reste={gen.reste}
            statut={gen.statut}
            montantPayeDepasseSomme={gen.montantPayeDepasseSomme}
            onFieldChange={gen.updateField}
            onSignatureChange={gen.setSignature}
          />
          <div className="mt-6 border-t border-border pt-5">
            <RecuGeneratorActions
              canWrite={gen.canWrite}
              submitting={gen.submitting}
              printing={gen.printing}
              onSave={gen.handleSave}
              onPrint={gen.handlePrint}
              onDownloadPdf={gen.handleDownloadPdf}
              onReset={gen.resetForm}
            />
          </div>
        </Card>

        <div className={showPreviewMobile ? "block" : "hidden lg:block"}>
          <RecuReceiptPreview
            data={gen.moduleData}
            brand={gen.brand}
            reference={gen.previewReference}
          />
        </div>
      </div>
    </div>
  );
}
