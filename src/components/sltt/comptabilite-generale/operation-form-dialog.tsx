"use client";

import { useEffect, useMemo, useState } from "react";
import type { EntiteComptable, OperationComptableType } from "@/lib/domain-types";
import { computeMontantFromQuantitePrixUnitaire } from "@/lib/comptabilite-generale";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { formatFCFA } from "@/lib/format";
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
import { NATURE_SUGGESTIONS } from "./shared";

const today = () => new Date().toISOString().slice(0, 10);

interface OperationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entite: EntiteComptable;
}

export function OperationFormDialog({ open, onOpenChange, entite }: OperationFormDialogProps) {
  const { toast } = useToast();
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const addOperationComptable = useStore((s) => s.addOperationComptable);
  const isTopDoumani = entite.type === "societe";

  const [date, setDate] = useState(today);
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [clientNom, setClientNom] = useState("");
  const [nature, setNature] = useState("");
  const [type, setType] = useState<OperationComptableType>("Sortie");
  const [modePaiement, setModePaiement] = useState<"Espèces" | "Virement" | "Mobile Money" | "Chèque">("Espèces");
  const [montant, setMontant] = useState("");
  const [quantite, setQuantite] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialisation du formulaire à l'ouverture du dialog
    setDate(today());
    setClientId("");
    setDossierId("");
    setClientNom("");
    setNature("");
    setType("Sortie");
    setModePaiement("Espèces");
    setMontant("");
    setQuantite("");
    setPrixUnitaire("");
  }, [open]);

  const montantCalcule = useMemo(
    () => computeMontantFromQuantitePrixUnitaire(Number(quantite) || undefined, Number(prixUnitaire) || undefined),
    [quantite, prixUnitaire],
  );
  const montantEffectif = isTopDoumani && montantCalcule != null ? montantCalcule : Number(montant.replace(/\s/g, "")) || 0;

  function handleClientSelect(id: string) {
    setClientId(id);
    if (id === "none") {
      setClientId("");
      return;
    }
    const client = clients.find((c) => c.id === id);
    if (client) setClientNom(client.nom);
  }

  function handleDossierSelect(id: string) {
    if (id === "none") {
      setDossierId("");
      return;
    }
    setDossierId(id);
    const dossier = dossiers.find((d) => d.id === id);
    if (dossier) {
      if (dossier.clientId) handleClientSelect(dossier.clientId);
      if (!nature) setNature(`Règlement dossier ${dossier.reference}`);
    }
  }

  async function handleSubmit() {
    if (!clientNom.trim()) {
      toastWarning(toast, { title: "Client / Tiers requis" });
      return;
    }
    if (!nature.trim()) {
      toastWarning(toast, { title: "Nature requise" });
      return;
    }
    if (montantEffectif <= 0) {
      toastWarning(toast, { title: "Montant invalide", description: "Le montant doit être supérieur à 0." });
      return;
    }
    setSubmitting(true);
    try {
      await addOperationComptable({
        entiteType: entite.type,
        annexeId: entite.type === "annexe" ? entite.id : undefined,
        societeId: entite.type === "societe" ? entite.id : undefined,
        date,
        clientId: clientId || undefined,
        dossierId: dossierId || undefined,
        clientNom: clientNom.trim(),
        nature: nature.trim(),
        type: isTopDoumani ? "Sortie" : type,
        montant: montantEffectif,
        modePaiement,
        quantite: isTopDoumani && quantite ? Number(quantite) : undefined,
        prixUnitaire: isTopDoumani && prixUnitaire ? Number(prixUnitaire) : undefined,
        source: "saisie",
      });
      toastSuccess(toast, { title: "Opération enregistrée", description: `${clientNom} — ${formatFCFA(montantEffectif)}.` });
      onOpenChange(false);
    } catch (error) {
      toastError(toast, error, { title: "Échec de l'enregistrement", fallback: "Réessayez." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle opération — {entite.label}</DialogTitle>
          <DialogDescription>Saisissez une entrée ou une sortie de caisse pour cette entité.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opc-date">Date</Label>
              <Input id="opc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
            </div>
            {!isTopDoumani && (
              <div className="space-y-2">
                <Label htmlFor="opc-type">Type</Label>
                <Select value={type} onValueChange={(value) => setType(value as OperationComptableType)}>
                  <SelectTrigger id="opc-type" className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrée">Entrée (Encaissement)</SelectItem>
                    <SelectItem value="Sortie">Sortie (Décaissement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opc-mode-paiement">Mode de paiement</Label>
              <Select value={modePaiement} onValueChange={(value) => setModePaiement(value as typeof modePaiement)}>
                <SelectTrigger id="opc-mode-paiement" className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opc-dossier">Dossier de transit (optionnel)</Label>
              <Select value={dossierId || "none"} onValueChange={handleDossierSelect}>
                <SelectTrigger id="opc-dossier" className="h-10 w-full"><SelectValue placeholder="Aucun (Frais général)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (Frais général)</SelectItem>
                  {dossiers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.reference} ({d.bl})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opc-client-existant">Client existant (optionnel)</Label>
            <Select value={clientId || "none"} onValueChange={handleClientSelect}>
              <SelectTrigger id="opc-client-existant" className="h-10 w-full"><SelectValue placeholder="Aucun (saisie libre)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun (saisie libre)</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opc-client-nom">
              Nom du tiers <span className="text-red-500">*</span>
            </Label>
            <Input id="opc-client-nom" value={clientNom} onChange={(e) => setClientNom(e.target.value)} placeholder="Ex. Ali Badra Traore" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opc-nature">
              Nature de la dépense <span className="text-red-500">*</span>
            </Label>
            <Input id="opc-nature" list="opc-nature-suggestions" value={nature} onChange={(e) => setNature(e.target.value)} placeholder="Ex. Frais de circuit" className="h-10" />
            <datalist id="opc-nature-suggestions">
              {NATURE_SUGGESTIONS.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          {isTopDoumani ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opc-quantite">Quantité</Label>
                <Input id="opc-quantite" type="number" min="0" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="Ex. 10" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opc-pu">Prix unitaire (FCFA)</Label>
                <Input id="opc-pu" type="number" min="0" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} placeholder={UI.placeholders.amountFCFA} className="h-10" />
              </div>
              <p className="col-span-full text-sm text-slate-500 dark:text-slate-400">
                Montant (Sortie) : <span className="font-semibold text-slate-700 dark:text-slate-200">{formatFCFA(montantEffectif)}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="opc-montant">
                Montant (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input id="opc-montant" type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder={UI.placeholders.amountFCFA} className="h-10" />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
