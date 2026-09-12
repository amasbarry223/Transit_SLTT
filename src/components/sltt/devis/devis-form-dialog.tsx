"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Devis, DevisInput } from "@/lib/store";
import { formatFCFA, parseAmount } from "@/lib/format";
import { resolveDossierCoutLabels, resolveTransitSociete } from "@/lib/societe-brand";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { UI } from "@/shared/utils/ui-messages";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";

export interface DevisFormProps {
  open: boolean;
  devis: Devis | null;
  clients: { id: string; nom: string }[];
  saving?: boolean;
  onClose: () => void;
  onSave: (input: DevisInput) => void;
}

export function DevisFormDialog({
  open,
  devis,
  clients,
  saving,
  onClose,
  onSave,
}: DevisFormProps) {
  const societes = useStore((s) => s.societes);
  const annexes = useStore((s) => s.annexes);
  const ports = useStore((s) => s.ports.filter((p) => p.actif));
  const { activeAnnexeId } = useActiveAnnexe();
  const societeNom = resolveTransitSociete(societes)?.nom || "Transit";
  const [clientId, setClientId] = useState(devis?.clientId ?? "");
  const [clientNom, setClientNom] = useState(devis?.clientNom ?? "");
  const [portId, setPortId] = useState(devis?.portId ?? "");
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
      setClientId(devis?.clientId ?? "");
      setClientNom(devis?.clientNom ?? "");
      setPortId(devis?.portId ?? "");
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
  const valid = !!clientId && !!nature.trim() && !!dateValidite;
  // Le Client n'a pas d'annexe propre en base (répertoire partagé, comme les
  // fournisseurs) : c'est l'annexe ACTIVE de l'utilisateur qui sera assignée
  // au devis à la création (devis-slice.ts addDevis — client?.annexeId, qui
  // n'existe pas côté API, retombe toujours sur l'annexe active). En édition,
  // l'annexe reste celle déjà fixée à la création du devis. Les intitulés de
  // rubrique s'adaptent en conséquence (ex. « Frais transit port » couvre la
  // manutention portuaire en Côte d'Ivoire).
  const annexeCode = annexes.find((a) => a.id === (devis?.annexeId ?? activeAnnexeId))?.code;
  const labels = resolveDossierCoutLabels(annexeCode);

  function handleClientChange(id: string) {
    setClientId(id);
    const c = clients.find((c) => c.id === id);
    if (c) setClientNom(c.nom);
  }

  function handleSave() {
    if (!valid) return;
    onSave({
      clientId,
      clientNom,
      portId: portId || undefined,
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

          <div className="space-y-2">
            <Label>Port d&apos;embarquement / de manutention</Label>
            <Select value={portId || "__none"} onValueChange={(v) => setPortId(v === "__none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Aucun</SelectItem>
                {ports.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom}
                    {p.ville ? ` — ${p.ville}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: labels.droitDouane, hint: labels.droitDouaneHint, val: droitDouane, set: setDroitDouane },
              { label: labels.fraisCircuit, hint: labels.fraisCircuitHint, val: fraisCircuit, set: setFraisCircuit },
              { label: `${labels.fraisPrestation} — ${societeNom}`, hint: labels.fraisPrestationHint, val: fraisPrestation, set: setFraisPrestation },
            ].map((f) => (
              <div key={f.label} className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  {f.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <Info className="size-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">{f.hint}</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={UI.placeholders.amountFCFA}
                  className="text-right tabular-nums"
                />
              </div>
            ))}
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
