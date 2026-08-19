"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileUp, UploadCloud } from "lucide-react";
import type { EntiteComptable } from "@/lib/domain-types";
import { entiteKeyOf } from "@/lib/comptabilite-generale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComptabiliteGeneraleImportDialog } from "./import-dialog";

// Charge tesseract.js/pdfjs-dist (via run-ocr) uniquement quand la route OCR
// est effectivement choisie, pas au chargement du module import-any-dialog.
const OcrCaptureDialog = dynamic(
  () => import("./ocr-capture-dialog").then((m) => ({ default: m.OcrCaptureDialog })),
  { ssr: false },
);

const ACCEPTED_MIME = ".xlsx,application/pdf,image/jpeg,image/png,image/heic,image/heif,image/webp";
const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function isExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xlsx") || file.type === EXCEL_MIME;
}

interface ImportAnyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entite: EntiteComptable;
  entites: EntiteComptable[];
}

/**
 * Point d'entrée unique "Importer un document" — détecte le type de fichier
 * à la sélection (extension/MIME) et route vers le flux Excel (preview +
 * validation ligne par ligne) ou OCR (revue des champs extraits) déjà
 * existants, sans dupliquer leur logique. Jamais d'enregistrement ici même :
 * ce composant ne fait que choisir la bonne destination.
 *
 * `entite` ne fixe que la présélection (l'onglet actif au moment de
 * l'ouverture) — l'utilisateur peut choisir une autre entité (une autre
 * annexe, ou Top Doumani) avant d'importer, sans avoir à fermer le dialogue.
 */
export function ImportAnyDialog({ open, onOpenChange, entite, entites }: ImportAnyDialogProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [route, setRoute] = useState<"excel" | "ocr" | null>(null);
  const [selectedEntite, setSelectedEntite] = useState(entite);

  function reset() {
    setPendingFile(null);
    setRoute(null);
    setSelectedEntite(entite);
  }

  function handleDelegateOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) reset();
  }

  if (route === "excel") {
    return <ComptabiliteGeneraleImportDialog open={open} onOpenChange={handleDelegateOpenChange} entite={selectedEntite} initialFile={pendingFile} />;
  }
  if (route === "ocr") {
    return <OcrCaptureDialog open={open} onOpenChange={handleDelegateOpenChange} entite={selectedEntite} initialFile={pendingFile} />;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="size-5 text-primary" />
            Importer un document
          </DialogTitle>
          <DialogDescription>
            Excel (.xlsx), PDF ou photo (JPG/PNG/HEIC) d&apos;un bon de caisse — le type est détecté automatiquement.
          </DialogDescription>
        </DialogHeader>

        {entites.length > 1 && (
          <Select
            value={entiteKeyOf(selectedEntite)}
            onValueChange={(key) => {
              const found = entites.find((e) => entiteKeyOf(e) === key);
              if (found) setSelectedEntite(found);
            }}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Entité" />
            </SelectTrigger>
            <SelectContent>
              {entites.map((e) => (
                <SelectItem key={entiteKeyOf(e)} value={entiteKeyOf(e)}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
