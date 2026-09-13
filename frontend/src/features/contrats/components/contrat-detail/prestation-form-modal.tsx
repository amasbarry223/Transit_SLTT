"use client";

import { useState } from "react";
import type { ContratPrestationStatut } from "@/lib/store";
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
import { PRESTATION_STATUTS } from "./shared";

export function PrestationFormModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    libelle: string;
    description?: string;
    montant?: number;
    statut: ContratPrestationStatut;
    datePrevue?: string;
    dateRealisation?: string;
  }) => void | Promise<void>;
}) {
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [statut, setStatut] = useState<ContratPrestationStatut>("Prévue");
  const [datePrevue, setDatePrevue] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setLibelle("");
    setDescription("");
    setMontant("");
    setStatut("Prévue");
    setDatePrevue("");
  }

  const canSubmit = Boolean(libelle.trim());

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        libelle: libelle.trim(),
        description: description.trim() || undefined,
        montant: montant ? parseAmount(montant) : undefined,
        statut,
        datePrevue: datePrevue || undefined,
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
          <DialogTitle>Ajouter une prestation optionnelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé <span className="text-red-500">*</span></Label>
            <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Montant (optionnel)</Label>
              <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date prévue</Label>
              <Input type="date" value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={statut} onValueChange={(v) => setStatut(v as ContratPrestationStatut)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESTATION_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
