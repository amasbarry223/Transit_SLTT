"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, ScanText, UploadCloud } from "lucide-react";
import type { EntiteComptable, OperationComptableType } from "@/lib/domain-types";
import { runOcrOnBlob } from "@/lib/documents/ocr/run-ocr";
import { mapOperationComptableFieldsFromText } from "@/lib/documents/ocr/mappers/operation-comptable-mapper";
import { OCR_LOW_CONFIDENCE_THRESHOLD } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormState = {
  date: string;
  clientNom: string;
  nature: string;
  type: OperationComptableType;
  montant: string;
};

function emptyForm(): FormState {
  return { date: new Date().toISOString().slice(0, 10), clientNom: "", nature: "", type: "Sortie", montant: "" };
}

const ACCEPTED_MIME = "application/pdf,image/jpeg,image/png,image/heic,image/heif,image/webp";

interface OcrCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entite: EntiteComptable;
  /** Fichier déjà sélectionné en amont (routeur d'import auto) — déclenche l'OCR sans repasser par le sélecteur. */
  initialFile?: File | null;
}

/**
 * Capture OCR autonome pour la comptabilité générale — ne dépend pas du
 * module Documents (pas de ocr_jobs/document_versions persistés) : le
 * fichier est analysé côté client, jamais uploadé, et rien n'est enregistré
 * tant que l'utilisateur n'a pas relu/corrigé les champs et cliqué sur
 * « Valider et enregistrer ». Les champs à faible confiance sont surlignés
 * en ambre, comme dans le dialog OCR du module Dossiers.
 */
export function OcrCaptureDialog({ open, onOpenChange, entite, initialFile }: OcrCaptureDialogProps) {
  const { toast } = useToast();
  const addOperationComptable = useStore((s) => s.addOperationComptable);
  const cloturesCaisse = useStore((s) => s.cloturesCaisse);
  const consumedInitialFileRef = useRef<File | null>(null);
  /** Course OCR en cours — abortée si le dialog se ferme ou se démonte pendant l'extraction. */
  const abortRef = useRef<AbortController | null>(null);

  // Même garde-fou que OperationFormDialog / ComptabiliteGeneraleImportDialog :
  // une pièce scannée ne doit pas pouvoir être enregistrée dans une période
  // déjà clôturée.
  const derniereClotureFin = useMemo(() => {
    const matching = cloturesCaisse.filter(
      (c) =>
        c.entiteType === entite.type &&
        (entite.type === "annexe" ? c.annexeId === entite.id : c.societeId === entite.id),
    );
    if (matching.length === 0) return null;
    return matching.reduce((max, c) => (c.periodeFin > max ? c.periodeFin : max), matching[0].periodeFin);
  }, [cloturesCaisse, entite]);

  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [form, setForm] = useState<FormState>(emptyForm);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [fileName, setFileName] = useState("");

  function resetAll() {
    setRunning(false);
    setSaving(false);
    setConfidence({});
    setForm(emptyForm());
    setOcrError(null);
    setRawText(null);
    setShowRawText(false);
    setFileName("");
  }

  async function handleFile(file: File) {
    // Annule une course précédente encore en vol avant d'en démarrer une nouvelle.
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setFileName(file.name);
    setRunning(true);
    setOcrError(null);
    setConfidence({});
    setForm(emptyForm());
    setRawText(null);

    try {
      const result = await runOcrOnBlob(file, file.type, mapOperationComptableFieldsFromText, ac.signal);
      if (ac.signal.aborted) return;
      setRawText(result.rawText || null);

      const conf: Record<string, number> = {};
      const next = emptyForm();
      for (const f of result.fields) {
        if (f.confidence != null) conf[f.fieldKey] = f.confidence;
        const v = f.fieldValue ?? "";
        if (f.fieldKey === "date" && v) next.date = v;
        else if (f.fieldKey === "client_nom") next.clientNom = v;
        else if (f.fieldKey === "nature") next.nature = v;
        else if (f.fieldKey === "montant") next.montant = v;
        else if (f.fieldKey === "type" && (v === "Entrée" || v === "Sortie")) next.type = v;
      }
      setConfidence(conf);
      setForm(next);
    } catch (e) {
      if (ac.signal.aborted) return;
      const message = e instanceof Error ? e.message : "OCR échoué";
      setOcrError(message);
      toastWarning(toast, { title: "OCR échoué", description: message });
    } finally {
      if (abortRef.current === ac) setRunning(false);
    }
  }

  useEffect(() => {
    if (open && initialFile && consumedInitialFileRef.current !== initialFile) {
      consumedInitialFileRef.current = initialFile;
      void handleFile(initialFile);
    }
    if (!open) consumedInitialFileRef.current = null;
  }, [open, initialFile]);

  // Fermeture du dialog ou démontage pendant l'OCR : annule la course en cours
  // pour ne pas appeler setRunning/setForm/etc. sur un composant qui n'affiche
  // plus ce résultat.
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function fieldClass(key: string) {
    const c = confidence[key];
    if (c == null) return "";
    if (c < OCR_LOW_CONFIDENCE_THRESHOLD) return "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40";
    return "";
  }

  const lowFieldsCount = Object.values(confidence).filter((c) => c < OCR_LOW_CONFIDENCE_THRESHOLD).length;

  async function handleValidate() {
    if (!form.clientNom.trim()) {
      toastWarning(toast, { title: "Client / tiers requis" });
      return;
    }
    if (!form.nature.trim()) {
      toastWarning(toast, { title: "Nature requise" });
      return;
    }
    const montant = Number(form.montant.replace(/\s/g, "")) || 0;
    if (montant <= 0) {
      toastWarning(toast, { title: "Montant invalide", description: "Le montant doit être supérieur à 0." });
      return;
    }
    if (derniereClotureFin && form.date <= derniereClotureFin) {
      toastWarning(toast, {
        title: "Période déjà clôturée",
        description: `Cette date est antérieure ou égale à la dernière clôture (${derniereClotureFin}). Corrigez la date avant d'enregistrer.`,
      });
      return;
    }
    setSaving(true);
    try {
      await addOperationComptable({
        entiteType: entite.type,
        annexeId: entite.type === "annexe" ? entite.id : undefined,
        societeId: entite.type === "societe" ? entite.id : undefined,
        date: form.date,
        clientNom: form.clientNom.trim(),
        nature: form.nature.trim(),
        type: form.type,
        montant,
        source: "import_ocr",
        importRef: fileName || undefined,
      });
      toastSuccess(toast, { title: "Opération enregistrée", description: "Données OCR validées." });
      onOpenChange(false);
      resetAll();
    } catch (e) {
      toastWarning(toast, { title: "Enregistrement impossible", description: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetAll(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanText className="size-5 text-primary" />
            Scanner un document — {entite.label}
          </DialogTitle>
          <DialogDescription>
            Photo ou PDF d&apos;un bon/reçu de caisse. Vérifiez les champs extraits avant d&apos;enregistrer — les champs incertains sont surlignés en ambre. Le fichier n&apos;est pas conservé après validation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center dark:border-slate-700">
            <input
              type="file"
              id="cg-ocr-file"
              className="hidden"
              accept={ACCEPTED_MIME}
              disabled={running}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
            {running ? <Loader2 className="mx-auto mb-2 size-7 animate-spin text-primary" /> : <UploadCloud className="mx-auto mb-2 size-7 text-primary" />}
            <label htmlFor="cg-ocr-file" className={cn("inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline", running && "pointer-events-none opacity-60")}>
              {running ? "Extraction OCR en cours…" : fileName ? "Changer de fichier" : "Sélectionner une photo ou un PDF"}
            </label>
            {fileName && !running && <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>}
          </div>

          {ocrError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">OCR incomplet</p>
                <p className="text-xs opacity-90">{ocrError}</p>
                <p className="mt-1 text-xs">Complétez les champs manuellement ci-dessous.</p>
              </div>
            </div>
          )}

          {lowFieldsCount > 0 && !running && (
            <p className="text-xs text-amber-700 dark:text-amber-400">{lowFieldsCount} champ(s) à faible confiance — vérifiez avant validation.</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cgo-date">
                Date
                {confidence.date != null && <span className="ml-1 text-xs font-normal text-slate-400">({Math.round(confidence.date * 100)}%)</span>}
              </Label>
              <Input id="cgo-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={cn("h-10", fieldClass("date"))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cgo-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as OperationComptableType }))}>
                <SelectTrigger id="cgo-type" className={cn("h-10 w-full", fieldClass("type"))}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrée">Entrée</SelectItem>
                  <SelectItem value="Sortie">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgo-client">
              Client / Tiers <span className="text-red-500">*</span>
              {confidence.client_nom != null && <span className="ml-1 text-xs font-normal text-slate-400">({Math.round(confidence.client_nom * 100)}%)</span>}
            </Label>
            <Input id="cgo-client" value={form.clientNom} onChange={(e) => setForm((f) => ({ ...f, clientNom: e.target.value }))} className={cn("h-10", fieldClass("client_nom"))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgo-nature">
              Nature <span className="text-red-500">*</span>
              {confidence.nature != null && <span className="ml-1 text-xs font-normal text-slate-400">({Math.round(confidence.nature * 100)}%)</span>}
            </Label>
            <Input id="cgo-nature" value={form.nature} onChange={(e) => setForm((f) => ({ ...f, nature: e.target.value }))} className={cn("h-10", fieldClass("nature"))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgo-montant">
              Montant (FCFA) <span className="text-red-500">*</span>
              {confidence.montant != null && <span className="ml-1 text-xs font-normal text-slate-400">({Math.round(confidence.montant * 100)}%)</span>}
            </Label>
            <Input id="cgo-montant" type="number" min="0" value={form.montant} onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))} className={cn("h-10", fieldClass("montant"))} />
          </div>

          {rawText && !running && (
            <div className="space-y-1.5">
              <button type="button" className="text-xs font-medium text-primary underline-offset-2 hover:underline" onClick={() => setShowRawText((v) => !v)}>
                {showRawText ? "Masquer le texte OCR" : "Voir le texte brut OCR"}
              </button>
              {showRawText && (
                <pre className="max-h-32 overflow-auto rounded-md border border-border bg-slate-50 p-2 text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700 bg-card dark:text-slate-300">
                  {rawText}
                </pre>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button onClick={() => void handleValidate()} disabled={running || saving || !fileName}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Valider et enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
