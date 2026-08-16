"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { useStore, type TypeDocument } from "@/lib/store";
import { deriveClientIdFromRattachement } from "@/lib/archives-utils";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_FILE_SIZE, TYPES_DOCUMENT, type RattachementKind } from "./shared";

/* ------------------------------------------------------------------ */
/* Dialog « + Archiver un document »                                   */
/* ------------------------------------------------------------------ */

export function ArchiveUploadDialog({
  open,
  onOpenChange,
  initialKind = "libre",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialKind?: RattachementKind;
}) {
  const { toast } = useToast();
  const addArchive = useStore((s) => s.addArchive);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const contrats = useStore((s) => s.contrats);

  const inputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [typeDocument, setTypeDocument] = useState<TypeDocument>("Autre");
  const [rattachementKind, setRattachementKind] = useState<RattachementKind>(initialKind);
  const [rattachementId, setRattachementId] = useState("");
  const [clientId, setClientId] = useState("");
  const [societeId, setSocieteId] = useState("");
  const [saving, setSaving] = useState(false);

  function reset(kind: RattachementKind = initialKind) {
    setFile(null);
    setTypeDocument("Autre");
    setRattachementKind(kind);
    setRattachementId("");
    setClientId("");
    setSocieteId("");
  }

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      reset(initialKind);
      // Une seule société active : pas d'ambiguïté, on la présélectionne
      // plutôt que de forcer une sélection manuelle systématique.
      if (societes.length === 1) setSocieteId(societes[0].id);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // L'attribut accept="image/*,application/pdf" des <input type="file"> n'est
    // qu'une suggestion côté navigateur (contournable via drag & drop, ou en
    // changeant le filtre "Tous les fichiers" du sélecteur système) : on
    // revalide donc le type MIME réel avant d'accepter le fichier.
    const isAllowedType = f.type === "application/pdf" || f.type.startsWith("image/");
    if (!isAllowedType) {
      toastWarning(toast, {
        title: "Type de fichier non autorisé",
        description: `${f.name} doit être une image ou un PDF.`,
      });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toastWarning(toast, { title: "Fichier trop volumineux", description: `${f.name} dépasse 50 Mo.` });
      return;
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) {
      toastWarning(toast, { title: "Sélectionnez un fichier" });
      return;
    }
    if (!societeId) {
      toastWarning(toast, { title: "Sélectionnez une société" });
      return;
    }
    setSaving(true);
    try {
      const derivedClientId = deriveClientIdFromRattachement(
        rattachementKind,
        rattachementId,
        dossiers,
        factures,
      );

      await addArchive({
        nom: file.name,
        typeDocument,
        taille: file.size,
        type: file.type || "application/octet-stream",
        file,
        dossierId: rattachementKind === "dossier" ? rattachementId || undefined : undefined,
        factureId: rattachementKind === "facture" ? rattachementId || undefined : undefined,
        depenseId: rattachementKind === "depense" ? rattachementId || undefined : undefined,
        clientId: derivedClientId ?? (rattachementKind === "libre" ? clientId || undefined : undefined),
        societeId,
      });

      toastSuccess(toast, { title: "Document archivé", description: file.name });
      reset();
      onOpenChange(false);
    } catch (e) {
      toastError(toast, e, { title: "Échec de l'archivage", fallback: "Erreur inattendue." });
    } finally {
      setSaving(false);
    }
  }

  const rattachementOptions = (() => {
    if (rattachementKind === "dossier") {
      return dossiers.map((d) => ({ id: d.id, label: `${d.reference} — ${d.clientNom}` }));
    }
    if (rattachementKind === "facture") {
      return factures.map((f) => ({ id: f.id, label: `${f.numero} — ${f.clientNom}` }));
    }
    if (rattachementKind === "depense") {
      return depenses.map((d) => {
        const contrat = contrats.find((c) => c.id === d.contratId);
        return { id: d.id, label: `${d.libelle}${contrat ? ` — ${contrat.reference}` : ""}` };
      });
    }
    return [];
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archiver un document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fichier <span className="text-red-500">*</span></Label>
            {/* Deux entrées séparées : combiner accept="image/*,application/pdf"
                avec capture="environment" force l'appareil photo sur certains
                navigateurs mobiles et masque l'accès aux fichiers/PDF existants. */}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            <input
              ref={captureInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" />
                Choisir un fichier
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => captureInputRef.current?.click()}>
                <Upload className="size-4" />
                Prendre une photo
              </Button>
            </div>
            {file && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{file.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type de document</Label>
            <Select value={typeDocument} onValueChange={(v) => setTypeDocument(v as TypeDocument)}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES_DOCUMENT.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rattacher à</Label>
            <Select
              value={rattachementKind}
              onValueChange={(v) => { setRattachementKind(v as RattachementKind); setRattachementId(""); }}
            >
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dossier">Dossier</SelectItem>
                <SelectItem value="facture">Facture</SelectItem>
                <SelectItem value="depense">Dépense</SelectItem>
                <SelectItem value="libre">Libre (aucun rattachement)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rattachementKind !== "libre" && (
            <div className="space-y-2">
              <Label>{rattachementKind === "dossier" ? "Dossier" : rattachementKind === "facture" ? "Facture" : "Dépense"}</Label>
              <Select
                value={rattachementId}
                onValueChange={(id) => {
                  setRattachementId(id);
                  if (rattachementKind === "facture") {
                    const f = factures.find((x) => x.id === id);
                    if (f?.societeId) setSocieteId(f.societeId);
                  } else if (rattachementKind === "depense") {
                    const dep = depenses.find((x) => x.id === id);
                    if (dep?.societeId) setSocieteId(dep.societeId);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {rattachementOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Société <span className="text-red-500">*</span></Label>
            <Select value={societeId} onValueChange={setSocieteId}>
              <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rattachementKind === "libre" && (
            <div className="space-y-2">
              <Label>Client (optionnel)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving || !file || !societeId}>
            {saving ? "Archivage…" : "Archiver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
