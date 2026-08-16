"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ScanText, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import type { DossierInput } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { OCR_LOW_CONFIDENCE_THRESHOLD } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { logError, logWarn } from "@/shared/logger";
import { UI } from "@/lib/ui-messages";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { runOcrOnStoragePath } from "@/lib/documents/ocr/run-ocr";
import { mapDossierFieldsFromText } from "@/lib/documents/ocr/mappers/dossier-mapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentViewer } from "./document-viewer";
import { cn } from "@/lib/utils";
import { DOSSIER_STATUT_EN_COURS } from "@/lib/constants";
import { resolveTransitSociete } from "@/lib/societe-brand";

const FIELD_LABELS: Record<string, string> = {
  bl: "N° BL",
  date: "Date",
  client_nom: "Client (détecté)",
  montant: "Montant investi",
  ref_douaniere: "Réf. douanière",
  nature: "Nature",
  camion: "Camion / immat.",
};

type FormState = {
  bl: string;
  date: string;
  nature: string;
  camion: string;
  montantInvesti: string;
  refDouaniere: string;
  clientId: string;
  notes: string;
};

function emptyForm(defaults?: Partial<FormState>): FormState {
  return {
    bl: "",
    date: new Date().toISOString().slice(0, 10),
    nature: "",
    camion: "",
    montantInvesti: "",
    refDouaniere: "",
    clientId: "",
    notes: "",
    ...defaults,
  };
}

export function OcrReviewDialog({
  open,
  onOpenChange,
  documentId,
  /** Si fourni, met à jour ce dossier au lieu d'en créer un. */
  existingDossierId,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  existingDossierId?: string;
  defaultClientId?: string;
}) {
  const { toast } = useToast();
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const canWriteDocs = usePermission("documents:write");
  const canWriteDossiers = usePermission("dossiers:write");
  const canValidate = canWriteDocs && canWriteDossiers;
  const documents = useStore((s) => s.documents);
  const documentVersions = useStore((s) => s.documentVersions);
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const societes = useStore((s) => s.societes);
  const { activeAnnexeId } = useActiveAnnexe();
  const createOcrJob = useStore((s) => s.createOcrJob);
  const updateOcrJobResult = useStore((s) => s.updateOcrJobResult);
  const failOcrJob = useStore((s) => s.failOcrJob);
  const validateOcrFields = useStore((s) => s.validateOcrFields);
  const linkDocumentToDossier = useStore((s) => s.linkDocumentToDossier);
  const getDocumentVersions = useStore((s) => s.getDocumentVersions);
  const getSignedDocumentUrl = useStore((s) => s.getSignedDocumentUrl);
  const addDossier = useStore((s) => s.addDossier);
  const updateDossier = useStore((s) => s.updateDossier);

  const doc = documents.find((d) => d.id === documentId);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [form, setForm] = useState<FormState>(() => emptyForm({ clientId: defaultClientId || "" }));
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [pdfPagesHint, setPdfPagesHint] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Job OCR de la course en cours — survivit aux re-renders / abort. */
  const activeJobIdRef = useRef<string | null>(null);

  const markJobFailed = useCallback(
    async (jobId: string | null | undefined, message: string) => {
      if (!jobId) return;
      try {
        await failOcrJob(jobId, message);
      } catch (err) {
        logWarn("[OCR] failOcrJob échoué, retry updateOcrJobResult", err);
        await updateOcrJobResult(jobId, {
          status: "failed",
          errorMessage: message,
        }).catch((e) => {
          logError("[OCR] Impossible de marquer le job failed", e);
        });
      }
    },
    [failOcrJob, updateOcrJobResult],
  );
  const markJobFailedRef = useRef(markJobFailed);
  useEffect(() => {
    markJobFailedRef.current = markJobFailed;
  });

  const lowFields = useMemo(
    () =>
      Object.entries(confidence).filter(
        ([, c]) => c < OCR_LOW_CONFIDENCE_THRESHOLD,
      ),
    [confidence],
  );

  const loadPreview = useCallback(async () => {
    if (!doc) return;
    let version = documentVersions.find(
      (v) => v.documentId === doc.id && v.version === doc.currentVersion,
    );
    if (!version) {
      const versions = await getDocumentVersions(doc.id);
      version = versions.find((v) => v.version === doc.currentVersion);
    }
    if (!version) return;
    const url = await getSignedDocumentUrl(version.storagePath);
    setPreviewUrl(url);
    return version;
  }, [doc, documentVersions, getDocumentVersions, getSignedDocumentUrl]);

  const applyFieldsToForm = useCallback(
    (fields: { fieldKey: string; fieldValue?: string; confidence?: number }[]) => {
      const conf: Record<string, number> = {};
      const next = emptyForm({
        clientId: existingDossierId
          ? dossiers.find((d) => d.id === existingDossierId)?.clientId || defaultClientId || ""
          : defaultClientId || "",
      });

      for (const f of fields) {
        if (f.confidence != null) conf[f.fieldKey] = f.confidence;
        const v = f.fieldValue ?? "";
        switch (f.fieldKey) {
          case "bl":
            next.bl = v;
            break;
          case "date":
            next.date = v || next.date;
            break;
          case "nature":
            next.nature = v;
            break;
          case "camion":
            next.camion = v;
            break;
          case "montant":
            next.montantInvesti = v;
            break;
          case "ref_douaniere":
            next.refDouaniere = v;
            break;
          case "client_nom": {
            const needle = v.trim().toLowerCase();
            if (!needle) break;
            const exact = clients.find((c) => c.nom.toLowerCase() === needle);
            const scored = exact
              ? exact
              : clients
                  .map((c) => {
                    const nom = c.nom.toLowerCase();
                    if (nom === needle) return { c, score: 3 };
                    if (nom.startsWith(needle) || needle.startsWith(nom)) return { c, score: 2 };
                    if (needle.length >= 4 && nom.includes(needle)) return { c, score: 1 };
                    return { c, score: 0 };
                  })
                  .filter((x) => x.score > 0)
                  .sort((a, b) => b.score - a.score)[0]?.c;
            if (scored) next.clientId = scored.id;
            break;
          }
          default:
            break;
        }
      }

      if (existingDossierId) {
        const existing = dossiers.find((d) => d.id === existingDossierId);
        if (existing) {
          next.clientId = existing.clientId;
          if (!next.bl) next.bl = existing.bl;
          if (!next.nature) next.nature = existing.nature;
          if (!next.camion) next.camion = existing.camion;
          if (!next.montantInvesti) next.montantInvesti = String(existing.montantInvesti);
        }
      }

      setConfidence(conf);
      setForm(next);
    },
    [clients, defaultClientId, dossiers, existingDossierId],
  );

  const runOcr = useCallback(async () => {
    if (!doc) return;

    // Annuler la course précédente (sans toast).
    const previousJobId = activeJobIdRef.current;
    abortRef.current?.abort();
    if (previousJobId) {
      activeJobIdRef.current = null;
      void markJobFailed(previousJobId, "OCR annulé (relance)");
    }

    const ac = new AbortController();
    abortRef.current = ac;

    setRunning(true);
    setOcrError(null);
    setConfidence({});
    setJobId(null);
    setRawText(null);
    setShowRawText(false);
    setPdfPagesHint(null);
    // Garde le preview précédent pendant le reload pour éviter un flash vide.
    setForm(emptyForm({ clientId: defaultClientId || "" }));

    let currentJobId: string | null = null;

    try {
      if (!doc) throw new Error("Document introuvable dans le store — rechargez la page.");
      const version = await loadPreview();
      if (!version) throw new Error("Version document introuvable");
      if (ac.signal.aborted) return;

      const job = await createOcrJob(doc.id, "dossier");
      currentJobId = job.id;
      activeJobIdRef.current = job.id;
      setJobId(job.id);

      await updateOcrJobResult(job.id, { status: "processing" });
      if (ac.signal.aborted) {
        if (activeJobIdRef.current === currentJobId) {
          activeJobIdRef.current = null;
          await markJobFailed(currentJobId, "OCR annulé");
        }
        return;
      }

      const result = await runOcrOnStoragePath(
        version.storagePath,
        doc.mimeType,
        mapDossierFieldsFromText,
        ac.signal,
      );
      if (ac.signal.aborted) {
        if (activeJobIdRef.current === currentJobId) {
          activeJobIdRef.current = null;
          await markJobFailed(currentJobId, "OCR annulé");
        }
        return;
      }

      await updateOcrJobResult(job.id, {
        status: "done",
        rawText: result.rawText,
        fields: result.fields,
      });

      if (result.pdfPages?.truncated) {
        setPdfPagesHint(
          `PDF : ${result.pdfPages.processed}/${result.pdfPages.total} pages analysées (plafond OCR). Les pages suivantes sont ignorées.`,
        );
      } else {
        setPdfPagesHint(null);
      }
      setRawText(result.rawText || null);

      if (ac.signal.aborted) {
        if (activeJobIdRef.current === currentJobId) {
          activeJobIdRef.current = null;
          await markJobFailed(currentJobId, "OCR annulé");
        }
        return;
      }
      applyFieldsToForm(result.fields);
    } catch (e) {
      const isAbort =
        ac.signal.aborted ||
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "AbortError");

      if (isAbort) {
        // Ne pas écraser un job déjà repris par une nouvelle course.
        if (currentJobId && activeJobIdRef.current === currentJobId) {
          activeJobIdRef.current = null;
          await markJobFailed(currentJobId, "OCR annulé");
        }
        return;
      }

      const message = e instanceof Error ? e.message : "OCR échoué";
      setOcrError(message);
      if (currentJobId && activeJobIdRef.current === currentJobId) {
        activeJobIdRef.current = null;
        await markJobFailed(currentJobId, message);
      } else if (currentJobId) {
        await markJobFailed(currentJobId, message);
      }
      toastWarning(toast, { title: "OCR échoué", description: message });
    } finally {
      if (abortRef.current === ac) {
        setRunning(false);
      }
    }
  }, [
    doc,
    loadPreview,
    createOcrJob,
    updateOcrJobResult,
    markJobFailed,
    defaultClientId,
    applyFieldsToForm,
    toast,
  ]);

  const runOcrRef = useRef(runOcr);
  useEffect(() => {
    runOcrRef.current = runOcr;
  });

  // Ouverture : toujours lancer l'OCR dès que le document est en store.
  // (La réutilisation d'anciens jobs masquait des extractions cassées.)
  useEffect(() => {
    if (!open || !documentId || !doc) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) void runOcrRef.current();
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      // N'aborte que si une course est vraiment en cours pour ce dialog.
      abortRef.current?.abort();
    };
  }, [open, documentId, doc?.id]);

  // Fermeture réelle du dialog → job en failed.
  useEffect(() => {
    if (open) return;
    abortRef.current?.abort();
    const jobId = activeJobIdRef.current;
    if (jobId) {
      activeJobIdRef.current = null;
      void markJobFailedRef.current(jobId, "OCR annulé (fermeture dialog)");
    }
  }, [open]);

  function fieldClass(key: string) {
    const c = confidence[key];
    if (c == null) return "";
    if (c < OCR_LOW_CONFIDENCE_THRESHOLD) {
      return "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40";
    }
    return "";
  }

  async function handleValidate() {
    if (!doc) return;
    if (!canValidate) {
      toastWarning(toast, { title: "Permission insuffisante", description: "La validation OCR nécessite documents:write et dossiers:write." });
      return;
    }
    if (!form.clientId) {
      toastWarning(toast, { title: "Client requis", description: "Sélectionnez un client avant d'enregistrer." });
      return;
    }
    const client = clients.find((c) => c.id === form.clientId);
    if (!client) return;

    setSaving(true);
    try {
      const montant = Number(form.montantInvesti) || 0;
      const ocrNoteBits = [
        form.notes.trim(),
        form.refDouaniere.trim() ? `Réf. douanière : ${form.refDouaniere.trim()}` : "",
      ].filter(Boolean);
      const ocrNotesBlock = ocrNoteBits.join("\n");

      if (existingDossierId) {
        const existing = dossiers.find((d) => d.id === existingDossierId);
        if (!existing) throw new Error("Dossier introuvable");
        // Fusion notes : préserver l'historique, jamais remplacer aveuglément.
        const existingNotes = (existing.notes || "").trim();
        let mergedNotes = existingNotes;
        if (ocrNotesBlock) {
          if (!existingNotes) {
            mergedNotes = ocrNotesBlock;
          } else if (!existingNotes.includes(ocrNotesBlock)) {
            mergedNotes = `${existingNotes}\n${ocrNotesBlock}`;
          }
        }
        const input: DossierInput = {
          societeId: existing.societeId,
          annexeId: existing.annexeId,
          clientId: existing.clientId,
          clientNom: existing.clientNom,
          nature: form.nature || existing.nature,
          bl: form.bl || existing.bl,
          camion: form.camion || existing.camion,
          date: form.date || existing.date,
          dateEcheance: existing.dateEcheance,
          dateDedouanement: existing.dateDedouanement,
          modeTransport: existing.modeTransport,
          noConteneur: existing.noConteneur,
          portEntree: existing.portEntree,
          poidsTotal: existing.poidsTotal,
          droitDouane: existing.droitDouane,
          fraisCircuit: existing.fraisCircuit,
          fraisPrestation: existing.fraisPrestation,
          montantInvesti: montant || existing.montantInvesti,
          statut: existing.statut,
          notes: mergedNotes || undefined,
        };
        await updateDossier(existingDossierId, input);
        await linkDocumentToDossier(doc.id, existingDossierId);
      } else {
        const transit = resolveTransitSociete(societes);
        if (!transit) {
          throw new Error("Aucune société transit configurée.");
        }
        if (!activeAnnexeId) {
          throw new Error("Aucune annexe assignée à l'utilisateur connecté.");
        }
        const input: DossierInput = {
          societeId: transit.id,
          annexeId: activeAnnexeId,
          clientId: form.clientId,
          clientNom: client.nom,
          nature: form.nature || "Transit",
          bl: form.bl,
          camion: form.camion,
          date: form.date,
          droitDouane: 0,
          fraisCircuit: 0,
          fraisPrestation: 0,
          montantInvesti: montant,
          statut: DOSSIER_STATUT_EN_COURS,
          notes: ocrNotesBlock || undefined,
        };
        const created = await addDossier(input);
        await linkDocumentToDossier(doc.id, created.id);
        openDossierDetail(created.id);
      }

      if (jobId) {
        await validateOcrFields(jobId, {
          bl: form.bl,
          date: form.date,
          nature: form.nature,
          camion: form.camion,
          montant: form.montantInvesti,
          ref_douaniere: form.refDouaniere,
          client_nom: client.nom,
        });
      }

      toastSuccess(toast, { title: existingDossierId ? "Dossier mis à jour" : "Dossier créé", description: "Données OCR validées et document lié." });
      onOpenChange(false);
    } catch (e) {
      toastError(toast, e, { title: "Enregistrement impossible", fallback: "Erreur" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <ScanText className="size-5 text-primary" />
            Validation OCR
          </DialogTitle>
          <DialogDescription>
            Vérifiez les champs extraits avant d&apos;enregistrer. Les champs incertains sont
            surlignés en ambre.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-2">
          <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
            <DocumentViewer
              url={previewUrl}
              mimeType={doc?.mimeType || "application/pdf"}
              fileName={doc?.nom}
            />
          </div>

          <div className="space-y-4 p-4">
            {running && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
                <Loader2 className="size-4 animate-spin" />
                Extraction OCR en cours…
              </div>
            )}

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

            {pdfPagesHint && !running && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                {pdfPagesHint}
              </div>
            )}

            {lowFields.length > 0 && !running && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {lowFields.length} champ(s) à faible confiance — vérifiez avant validation.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Client</Label>
                <Select
                  value={form.clientId || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
                  disabled={!!existingDossierId}
                >
                  <SelectTrigger className={cn(fieldClass("client_nom"))}>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(
                [
                  ["bl", "bl", "N° BL"],
                  ["date", "date", "Date"],
                  ["nature", "nature", "Nature"],
                  ["camion", "camion", "Camion"],
                  ["montantInvesti", "montant", "Montant investi"],
                  ["refDouaniere", "ref_douaniere", "Réf. douanière"],
                ] as const
              ).map(([formKey, confKey, label]) => (
                <div key={formKey} className="space-y-1.5">
                  <Label>
                    {label}
                    {confidence[confKey] != null && (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        ({Math.round(confidence[confKey] * 100)}%)
                      </span>
                    )}
                  </Label>
                  <Input
                    type={formKey === "date" ? "date" : formKey === "montantInvesti" ? "number" : "text"}
                    value={form[formKey]}
                    className={cn(fieldClass(confKey))}
                    onChange={(e) => setForm((f) => ({ ...f, [formKey]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optionnel"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Champs détectés : {Object.keys(FIELD_LABELS).filter((k) => confidence[k] != null).join(", ") || "aucun"}
            </p>

            {rawText && !running && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => setShowRawText((v) => !v)}
                >
                  {showRawText ? "Masquer le texte OCR" : "Voir le texte brut OCR"}
                </button>
                {showRawText && (
                  <pre className="max-h-40 overflow-auto rounded-md border border-border bg-slate-50 p-2 text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {rawText}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {!canValidate && (
            <p className="mr-auto max-w-sm text-xs text-amber-700 dark:text-amber-400">
              {canWriteDocs && !canWriteDossiers
                ? "Extraction possible, validation désactivée : droit dossiers:write manquant (rôle Comptable / lecture seule)."
                : "Validation désactivée : droits documents:write et dossiers:write requis."}
            </p>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button variant="outline" onClick={() => void runOcr()} disabled={running || saving}>
            Relancer OCR
          </Button>
          <Button
            onClick={() => void handleValidate()}
            disabled={running || saving || !canValidate}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Valider et enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
