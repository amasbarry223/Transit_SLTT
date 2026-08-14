"use client";

import * as React from "react";
import { Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  useStore,
  type Fournisseur,
  type FournisseurInput,
  type FournisseurType,
  type FournisseurStatut,
} from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TYPES } from "./fournisseur-type-meta";

export function FournisseurFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Fournisseur;
}) {
  const addFournisseur = useStore((s) => s.addFournisseur);
  const updateFournisseur = useStore((s) => s.updateFournisseur);
  const { toast } = useToast();

  const [nom, setNom] = React.useState(editing?.nom ?? "");
  const [type, setType] = React.useState<FournisseurType>(editing?.type ?? "Transporteur");
  const [contact, setContact] = React.useState(editing?.contact ?? "");
  const [telephone, setTelephone] = React.useState(editing?.telephone ?? "");
  const [email, setEmail] = React.useState(editing?.email ?? "");
  const [adresse, setAdresse] = React.useState(editing?.adresse ?? "");
  const [tarif, setTarif] = React.useState(
    editing?.tarifContractuel ? String(editing.tarifContractuel) : "",
  );
  const [statut, setStatut] = React.useState<FournisseurStatut>(editing?.statut ?? "Actif");
  const [saving, setSaving] = React.useState(false);

  const resetKey = open ? (editing?.id ?? "new") : null;
  const [prevResetKey, setPrevResetKey] = React.useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (resetKey !== null) {
      setNom(editing?.nom ?? "");
      setType(editing?.type ?? "Transporteur");
      setContact(editing?.contact ?? "");
      setTelephone(editing?.telephone ?? "");
      setEmail(editing?.email ?? "");
      setAdresse(editing?.adresse ?? "");
      setTarif(editing?.tarifContractuel ? String(editing.tarifContractuel) : "");
      setStatut(editing?.statut ?? "Actif");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    const input: FournisseurInput = {
      nom: nom.trim(),
      type,
      contact: contact.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      adresse: adresse.trim(),
      tarifContractuel: tarif ? parseFloat(tarif) : undefined,
      statut,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateFournisseur(editing.id, input);
        toast({ title: "Fournisseur mis à jour", description: nom });
      } else {
        await addFournisseur(input);
        toast({ title: "Fournisseur créé", description: nom });
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Impossible d'enregistrer le fournisseur";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
          <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>
                Raison sociale <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom du prestataire"
                className="h-10"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type de prestataire</Label>
              <Select value={type} onValueChange={(v) => setType(v as FournisseurType)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => setStatut(v as FournisseurStatut)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Personne de contact</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Prénom Nom"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+223 ..."
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@..."
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tarif contractuel (FCFA)</Label>
              <Input
                type="number"
                value={tarif}
                onChange={(e) => setTarif(e.target.value)}
                placeholder="0"
                className="h-10"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Adresse</Label>
              <Input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Adresse complète"
                className="h-10"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!nom.trim() || saving}>
              <Check className="size-4" />
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
