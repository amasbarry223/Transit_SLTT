"use client";

import { useState } from "react";
import { ScanText, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentUploadZone, type DocumentUploadFile } from "./document-upload-zone";
import { OcrReviewDialog } from "./ocr-review-dialog";

/**
 * Entrée « créer un dossier depuis un document » (hors fiche dossier).
 * Upload → OCR review → addDossier + link.
 */
export function CreateDossierFromOcrButton({
  className,
}: {
  className?: string;
}) {
  const { toast } = useToast();
  const canDocs = usePermission("documents:write");
  const canDossiers = usePermission("dossiers:write");
  const canUse = canDocs && canDossiers;
  const addDocument = useStore((s) => s.addDocument);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ocrDocId, setOcrDocId] = useState<string | null>(null);

  if (!canUse) return null;

  async function handleUpload(files: DocumentUploadFile[]) {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    try {
      const doc = await addDocument({
        nom: file.nom,
        categorie: file.categorie,
        taille: file.taille,
        mimeType: file.mimeType,
        dataUrl: file.dataUrl,
      });
      setUploadOpen(false);
      setOcrDocId(doc.id);
    } catch (e) {
      toast({
        title: "Upload impossible",
        description: e instanceof Error ? e.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        onClick={() => setUploadOpen(true)}
      >
        <ScanText className="size-4" />
        Depuis OCR
      </Button>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanText className="size-5 text-primary" />
              Nouveau dossier via OCR
            </DialogTitle>
            <DialogDescription>
              Importez un BL, DAU ou facture. L&apos;extraction préremplit le formulaire ;
              vous validez avant création.
            </DialogDescription>
          </DialogHeader>
          {busy ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Envoi du document…
            </div>
          ) : (
            <DocumentUploadZone onUpload={handleUpload} multiple={false} />
          )}
        </DialogContent>
      </Dialog>

      <OcrReviewDialog
        open={!!ocrDocId}
        onOpenChange={(open) => {
          if (!open) setOcrDocId(null);
        }}
        documentId={ocrDocId}
      />
    </>
  );
}
