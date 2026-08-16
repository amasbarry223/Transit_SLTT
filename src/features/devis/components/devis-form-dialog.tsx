"use client";

import { useState } from "react";
import type { Devis, DevisInput } from "@/lib/store";
import type { Societe } from "@/lib/domain-types";
import { formatFCFA, parseAmount } from "@/lib/format";
import { resolveTransitSociete } from "@/lib/societe-brand";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export interface DevisFormProps {
  open: boolean;
  devis: Devis | null;
  clients: { id: string; nom: string }[];
  societes: Societe[];
  defaultSocieteId?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: DevisInput) => void;
}

export function DevisFormDialog({
  open,
  devis,
  clients,
  societes,
  defaultSocieteId,
  saving,
  onClose,
  onSave,
}: DevisFormProps) {
  const transitId = resolveTransitSociete(societes)?.id ?? "";
  const initialSociete =
    devis?.societeId || defaultSocieteId || transitId || "";

  const [societeId, setSocieteId] = useState(initialSociete);
  const [clientId, setClientId] = useState(devis?.clientId ?? "");
  const [clientNom, setClientNom] = useState(devis?.clientNom ?? "");
  const [nature, setNature] = useState(devis?.nature ?? "");
  const [droitDouane, setDroitDouane] = useState(devis ? String(devis.droitDouane) : "");
  const [fraisCircuit, setFraisCircuit] = useState(devis ? String(devis.fraisCircuit) : "");
  const [fraisPrestation, setFraisPrestation] = useState(devis ? String(devis.fraisPrestation) : "");
  const [dateValidite, setDateValidite] = useState(devis?.dateValidite ?? "");
  const [notes, setNotes] = useState(devis?.notes ?? "");
  const isEdit = devis !== null;

  // Réinitialise le formulaire quand le dialog s'ouvre ou que le devis cible change.
  const openKey = open ? (devis?.id ?? "new") : null;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      setSocieteId(devis?.societeId || defaultSocieteId || transitId || "");
      setClientId(devis?.clientId ?? "");
      setClientNom(devis?.clientNom ?? "");
      setNature(devis?.nature ?? "");
      setDroitDouane(devis ? String(devis.droitDouane) : "");
      setFraisCircuit(devis ? String(devis.fraisCircuit) : "");
      setFraisPrestation(devis ? String(devis.fraisPrestation) : "");
      setDateValidite(devis?.dateValidite ?? "");
      setNotes(devis?.notes ?? "");
    }
  }

  const dd = parseAmount(droitDouane);
  const fc = parseAmount(fraisCircuit);
  const fp = parseAmount(fraisPrestation);
  const total = dd + fc + fp;
  const valid = !!societeId && !!clientId && !!nature.trim() && !!dateValidite;

  function handleClientChange(id: string) {
    setClientId(id);
    const c = clients.find((c) => c.id === id);
    if (c) setClientNom(c.nom);
  }

  function handleSave() {
    if (!valid) return;
    onSave({
      societeId,
      clientId,
      clientNom,
      nature,
      droitDouane: dd,
      fraisCircuit: fc,
      fraisPrestation: fp,
      dateValidite,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le devis" : "Nouveau devis"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations du devis."
              : "Créez un devis client avant d'ouvrir un dossier."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>
              Société <span className="text-red-500">*</span>
            </Label>
            <Select value={societeId || undefined} onValueChange={setSocieteId}>
              <SelectTrigger aria-label="Sélectionner une société">
                <SelectValue placeholder="Sélectionner une société" />
              </SelectTrigger>
              <SelectContent>
                {societes
                  .filter((s) => s.actif || s.id === societeId)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nom}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Client <span className="text-red-500">*</span>
            </Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>
              Nature de la marchandise <span className="text-red-500">*</span>
            </Label>
            <Input
              value={nature}
              onChange={(e) => setNature(e.target.value)}
              placeholder="ex. Matériaux de construction"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Droits douane (FCFA)</Label>
              <Input
                value={droitDouane}
                onChange={(e) => setDroitDouane(e.target.value)}
                placeholder={UI.placeholders.amountFCFA}
                className="text-right tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Frais circuit (FCFA)</Label>
              <Input
                value={fraisCircuit}
                onChange={(e) => setFraisCircuit(e.target.value)}
                placeholder={UI.placeholders.amountFCFA}
                className="text-right tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Prestation SLTT (FCFA)</Label>
              <Input
                value={fraisPrestation}
                onChange={(e) => setFraisPrestation(e.target.value)}
                placeholder={UI.placeholders.amountFCFA}
                className="text-right tabular-nums"
              />
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 text-sm dark:bg-blue-950/40">
              <span className="font-medium text-blue-700 dark:text-blue-300">Total estimé</span>
              <span className="font-bold tabular-nums text-blue-900 dark:text-blue-200">
                {formatFCFA(total)}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Date de validité <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={dateValidite}
              onChange={(e) => setDateValidite(e.target.value)}
              className="sm:w-1/2"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (facultatif)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions, remarques..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!valid || saving}>
            {isEdit ? "Enregistrer" : "Créer le devis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
