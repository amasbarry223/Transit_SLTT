"use client";

import { useState } from "react";
import { useStore, type ContratInput, type ContratStatut } from "@/lib/store";
import { CONTRAT_ALLOWED_TRANSITIONS } from "@/lib/status-flow";
import { parseAmount } from "@/lib/format";
import { QuickClientButton } from "@/features/clients";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export function ContratFormModal({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: {
    clientId: string;
    clientNom: string;
    annexeId: string;
    objet: string;
    dateDebut: string;
    dateFin?: string;
    montant: number;
    statut: ContratStatut;
    notes?: string;
  };
  onSubmit: (input: ContratInput) => void;
}) {
  const clients = useStore((s) => s.clients);
  const { annexes, activeAnnexeId } = useActiveAnnexe();

  const [annexeId, setAnnexeId] = useState(initial.annexeId);
  const [clientId, setClientId] = useState(initial.clientId);
  const [objet, setObjet] = useState(initial.objet);
  const [dateDebut, setDateDebut] = useState(initial.dateDebut);
  const [dateFin, setDateFin] = useState(initial.dateFin ?? "");
  const [montant, setMontant] = useState(String(initial.montant));
  const [statut, setStatut] = useState<ContratStatut>(initial.statut);
  const [notes, setNotes] = useState(initial.notes ?? "");

  const showAnnexe = annexes.length > 1;
  const resolvedAnnexeId = showAnnexe ? annexeId : (activeAnnexeId ?? initial.annexeId);

  const selectedClient = clients.find((c) => c.id === clientId);
  const dateFinValide = !dateFin || dateFin >= dateDebut;
  const canSubmit = Boolean(
    clientId &&
      objet.trim() &&
      dateFinValide &&
      (!showAnnexe || annexeId),
  );
  const statutOptions = [
    initial.statut,
    ...(CONTRAT_ALLOWED_TRANSITIONS[initial.statut] ?? []),
  ];

  function handleSubmit() {
    if (!selectedClient || !canSubmit) return;
    onSubmit({
      clientId,
      clientNom: selectedClient.nom,
      annexeId: resolvedAnnexeId || undefined,
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
          {showAnnexe && (
            <div className="space-y-2">
              <Label>Annexe <span className="text-red-500">*</span></Label>
              <Select value={annexeId} onValueChange={setAnnexeId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une annexe" />
                </SelectTrigger>
                <SelectContent>
                  {annexes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                {statutOptions.map((s) => (
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
