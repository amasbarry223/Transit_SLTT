"use client";

import { useState } from "react";
import { FileUp, UploadCloud } from "lucide-react";
import type { EntiteComptable } from "@/lib/domain-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComptabiliteGeneraleImportDialog } from "./import-dialog";
import { OcrCaptureDialog } from "./ocr-capture-dialog";

const ACCEPTED_MIME = ".xlsx,application/pdf,image/jpeg,image/png,image/heic,image/heif,image/webp";
const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function isExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xlsx") || file.type === EXCEL_MIME;
}

interface ImportAnyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entite: EntiteComptable;
}

/**
 * Point d'entrée unique "Importer un document" — détecte le type de fichier
 * à la sélection (extension/MIME) et route vers le flux Excel (preview +
 * validation ligne par ligne) ou OCR (revue des champs extraits) déjà
 * existants, sans dupliquer leur logique. Jamais d'enregistrement ici même :
 * ce composant ne fait que choisir la bonne destination.
 */
export function ImportAnyDialog({ open, onOpenChange, entite }: ImportAnyDialogProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [route, setRoute] = useState<"excel" | "ocr" | null>(null);

  function reset() {
    setPendingFile(null);
    setRoute(null);
  }

  function handleDelegateOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) reset();
  }

  if (route === "excel") {
    return <ComptabiliteGeneraleImportDialog open={open} onOpenChange={handleDelegateOpenChange} entite={entite} initialFile={pendingFile} />;
  }
  if (route === "ocr") {
    return <OcrCaptureDialog open={open} onOpenChange={handleDelegateOpenChange} entite={entite} initialFile={pendingFile} />;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="size-5 text-primary" />
            Importer un document — {entite.label}
          </DialogTitle>
          <DialogDescription>
            Excel (.xlsx), PDF ou photo (JPG/PNG/HEIC) d&apos;un bon de caisse — le type est détecté automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
          <input
            type="file"
            id="cg-import-any-file"
            className="hidden"
            accept={ACCEPTED_MIME}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPendingFile(file);
                setRoute(isExcelFile(file) ? "excel" : "ocr");
              }
              e.target.value = "";
            }}
          />
          <UploadCloud className="mx-auto mb-2 size-8 text-primary" />
          <label
            htmlFor="cg-import-any-file"
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Sélectionner un fichier
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
