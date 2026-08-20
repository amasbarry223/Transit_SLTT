"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { PaiementMode } from "@/lib/domain-types";
import { parseAmount } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODES_PAIEMENT } from "./shared";

export function DepenseFormModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    libelle: string;
    montant: number;
    dateDepense: string;
    modePaiement: PaiementMode;
    note?: string;
    justificatifDataUrl?: string;
    justificatifNom?: string;
  }) => void | Promise<void>;
}) {
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<PaiementMode>("Espèces");
  const [note, setNote] = useState("");
  const [justificatif, setJustificatif] = useState<{ dataUrl: string; nom: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setLibelle("");
    setMontant("");
    setDate(new Date().toISOString().slice(0, 10));
    setMode("Espèces");
    setNote("");
    setJustificatif(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJustificatif({ dataUrl: ev.target?.result as string, nom: file.name });
    reader.readAsDataURL(file);
  }

  const canSubmit = Boolean(libelle.trim() && Number(montant) > 0);

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        libelle: libelle.trim(),
        montant: parseAmount(montant),
        dateDepense: date,
        modePaiement: mode,
        note: note.trim() || undefined,
        justificatifDataUrl: justificatif?.dataUrl,
        justificatifNom: justificatif?.nom,
      });
      reset();
    } catch {
      // Le parent affiche déjà le toast d'erreur — le formulaire reste rempli
      // pour permettre de réessayer sans tout ressaisir.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une dépense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé <span className="text-red-500">*</span></Label>
            <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Montant <span className="text-red-500">*</span></Label>
              <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaiementMode)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES_PAIEMENT.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Justificatif (optionnel)</Label>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
              {justificatif ? justificatif.nom : "Joindre un scan"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit || saving}>
            {saving ? "Ajout en cours…" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
