"use client";

import { useState } from "react";
import { useStore, type ContratInput, type ContratStatut } from "@/lib/store";
import { parseAmount } from "@/lib/format";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONTRAT_STATUTS } from "./shared";

export function ContratFormModal({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: {
    societeId: string;
    clientId: string;
    clientNom: string;
    objet: string;
    dateDebut: string;
    dateFin?: string;
    montant: number;
    statut: ContratStatut;
    notes?: string;
  };
  onSubmit: (input: ContratInput) => void;
}) {
  const societes = useStore((s) => s.societes);
  const clients = useStore((s) => s.clients);

  const [societeId, setSocieteId] = useState(initial.societeId);
  const [clientId, setClientId] = useState(initial.clientId);
  const [objet, setObjet] = useState(initial.objet);
  const [dateDebut, setDateDebut] = useState(initial.dateDebut);
  const [dateFin, setDateFin] = useState(initial.dateFin ?? "");
  const [montant, setMontant] = useState(String(initial.montant));
  const [statut, setStatut] = useState<ContratStatut>(initial.statut);
  const [notes, setNotes] = useState(initial.notes ?? "");

  const selectedClient = clients.find((c) => c.id === clientId);
  const dateFinValide = !dateFin || dateFin >= dateDebut;
  const canSubmit = Boolean(societeId && clientId && objet.trim() && dateFinValide);

  function handleSubmit() {
    if (!selectedClient || !canSubmit) return;
    onSubmit({
      societeId,
      clientId,
      clientNom: selectedClient.nom,
      objet: objet.trim(),
      dateDebut,
      dateFin: dateFin || undefined,
      montant: parseAmount(montant),
      statut,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier le contrat</DialogTitle>
          <DialogDescription>Mettez à jour les informations du contrat.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Société <span className="text-red-500">*</span></Label>
            <Select value={societeId} onValueChange={setSocieteId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Client <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <QuickClientButton onCreated={setClientId} />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Objet <span className="text-red-500">*</span></Label>
            <Textarea value={objet} onChange={(e) => setObjet(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Date de début</Label>
            <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Date de fin</Label>
            <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-10" />
            {!dateFinValide && (
              <p className="text-xs text-red-600 dark:text-red-400">La date de fin doit être postérieure à la date de début.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Montant</Label>
            <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={statut} onValueChange={(v) => setStatut(v as ContratStatut)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRAT_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
