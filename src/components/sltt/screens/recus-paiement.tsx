"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Eye, EyeOff, FileText, Printer } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RecuGeneratorActions } from "@/components/sltt/recus-paiement/recu-generator-actions";
import { RecuGeneratorForm } from "@/components/sltt/recus-paiement/recu-generator-form";
import { RecuReceiptPreview } from "@/components/sltt/recus-paiement/recu-receipt-preview";
import { useRecuGenerator } from "@/components/sltt/recus-paiement/use-recu-generator";

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
      action: (
        <ToastAction altText="Imprimer le reçu" onClick={() => void gen.printModuleData(saved.moduleData)}>
          Imprimer
        </ToastAction>
      ),
    });
  }, [gen, toast]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Créer un reçu de paiement"
        description="Renseignez les informations du paiement — l'aperçu se met à jour en temps réel."
        showTitle
      />

      {gen.lastSaved ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-emerald-50/40 px-5 py-4 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-emerald-950/10">
          <div className="flex items-start gap-3 text-sm text-emerald-900 dark:text-emerald-200">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="font-medium">Dernier reçu enregistré</p>
              <p className="mt-0.5 text-emerald-800/90 dark:text-emerald-300/90">
                <strong className="font-mono">{gen.lastSaved.reference}</strong>
                {" — "}
                {gen.lastSaved.beneficiaire} ({formatFCFA(gen.lastSaved.montantPaye)})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void gen.handlePrintLastSaved()}>
              <Printer className="size-4" />
              Imprimer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => gen.resetForm()}>
              Nouveau reçu
            </Button>
          </div>
        </div>
      ) : null}

      <div className="lg:hidden">
        <Button variant="outline" className="w-full justify-center gap-2" onClick={() => setShowPreviewMobile((v) => !v)}>
          {showPreviewMobile ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {showPreviewMobile ? "Masquer l'aperçu" : "Afficher l'aperçu du reçu"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-start xl:gap-8">
        <div className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <FileText className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Informations du reçu</CardTitle>
                  <CardDescription className="mt-0.5">
                    Tous les champs marqués * sont obligatoires.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="pt-6">
              <RecuGeneratorActions
                canWrite={gen.canWrite}
                submitting={gen.submitting}
                printing={gen.printing}
                onSave={handleSave}
                onPrint={gen.handlePrint}
                onDownloadPdf={gen.handleDownloadPdf}
                onReset={gen.resetForm}
              />
            </CardContent>
          </Card>
        </div>

        <div className={cn("lg:sticky lg:top-4", showPreviewMobile ? "block" : "hidden lg:block")}>
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
