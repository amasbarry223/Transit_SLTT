"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Client, StockItem, UpdateStockItemInput } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { FormField } from "@/components/sltt/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Édition d'un article de stock existant — formulaire à une étape (pas
 * l'assistant 3 étapes de new-item-dialog.tsx, qui n'a de sens qu'à la
 * création avec choix de société/annexe/quantité initiale). Ne touche
 * jamais quantite (solde dérivé des mouvements) ni société/annexe
 * (déplacer un article est une opération structurelle, hors scope ici).
 */
export function EditItemDialog({
  open,
  onOpenChange,
  item,
  clients,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockItem | null;
  clients: Client[];
  onSubmit: (id: string, input: UpdateStockItemInput) => void | Promise<void>;
}) {
  // Initialisé une fois depuis `item` — le parent doit remonter ce composant
  // (prop `key`) quand l'article édité change, comme new-item-dialog.tsx le
  // fait déjà pour la création (`key={newItemKey}`).
  const [marchandise, setMarchandise] = useState(item?.marchandise ?? "");
  const [unite, setUnite] = useState(item?.unite ?? "");
  const [seuil, setSeuil] = useState(String(item?.seuil ?? 10));
  const [depositaire, setDepositaire] = useState(item?.depositaire === "—" ? "" : (item?.depositaire ?? ""));
  const [commercial, setCommercial] = useState(item?.commercial === "—" ? "" : (item?.commercial ?? ""));
  const [clientId, setClientId] = useState(item?.clientId ?? "");
  const [date, setDate] = useState(item?.date ?? new Date().toISOString().slice(0, 10));
  // Valeur totale reconstituée (payé + reste à payer) — même convention que
  // new-item-dialog.tsx, qui saisit la valeur totale et en déduit les deux
  // autres montants plutôt que de les saisir indépendamment.
  const [valeurTotale, setValeurTotale] = useState(String((item?.sommePayee ?? 0) + (item?.resteAPayer ?? 0)));
  const [sommePayee, setSommePayee] = useState(String(item?.sommePayee ?? 0));
  const [saving, setSaving] = useState(false);

  const valid = Boolean(marchandise.trim() && unite.trim());

  async function handleSave() {
    if (!item || !valid || saving) return;
    const valeurTotaleNum = Math.max(0, Number(valeurTotale) || 0);
    const sommePayeeNum = Math.min(Math.max(0, Number(sommePayee) || 0), valeurTotaleNum);
    setSaving(true);
    try {
      // Le parent décide de fermer (uniquement en cas de succès) — cf.
      // new-item-dialog.tsx, même convention : onSubmit avale son erreur en
      // interne (toast) sans la relancer, donc c'est à lui de garder le
      // dialog ouvert pour permettre une correction.
      await onSubmit(item.id, {
        marchandise: marchandise.trim(),
        unite: unite.trim(),
        seuil: Math.max(0, Number(seuil) || 0),
        depositaire: depositaire.trim() || "—",
        commercial: commercial.trim() || "—",
        sommePayee: sommePayeeNum,
        resteAPayer: Math.max(0, valeurTotaleNum - sommePayeeNum),
        date,
        clientId: clientId || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" />
            Modifier l&apos;article
          </DialogTitle>
          <DialogDescription>
            Corrige le nom, l&apos;unité ou le suivi de cet article. La quantité en
            stock et la société/annexe ne se modifient pas ici — utilisez les entrées/sorties.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Marchandise" required>
              <Input
                value={marchandise}
                onChange={(e) => setMarchandise(e.target.value)}
                placeholder="ex. Riz parfumé 25 kg"
                className="h-10"
                autoFocus
              />
            </FormField>
          </div>

          <FormField label="Unité" required>
            <Input
              value={unite}
              onChange={(e) => setUnite(e.target.value)}
              placeholder="ex. cartons, kg, L"
              className="h-10"
            />
          </FormField>

          <FormField label="Seuil d'alerte" hint="En dessous de cette quantité, l'article apparaît dans les alertes de stock faible.">
            <Input
              type="number"
              min={0}
              value={seuil}
              onChange={(e) => setSeuil(e.target.value)}
              className="h-10"
            />
          </FormField>

          <FormField label="Dépositaire">
            <Input
              value={depositaire}
              onChange={(e) => setDepositaire(e.target.value)}
              placeholder="Nom du dépositaire"
              className="h-10"
            />
          </FormField>

          <FormField label="Commercial">
            <Input
              value={commercial}
              onChange={(e) => setCommercial(e.target.value)}
              placeholder="Nom du commercial"
              className="h-10"
            />
          </FormField>

          <FormField label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10"
            />
          </FormField>

          <FormField label="Valeur totale de la marchandise (FCFA)">
            <Input
              type="number"
              min={0}
              value={valeurTotale}
              onChange={(e) => setValeurTotale(e.target.value)}
              className="h-10"
            />
          </FormField>

          <FormField label="Somme payée (FCFA)">
            <Input
              type="number"
              min={0}
              value={sommePayee}
              onChange={(e) => setSommePayee(e.target.value)}
              className="h-10"
            />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 bg-muted/40">
            <span className="text-sm text-muted-foreground">Reste à payer</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatFCFA(Math.max(0, (Number(valeurTotale) || 0) - (Number(sommePayee) || 0)))}
            </span>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label className="text-sm font-medium text-foreground/90">Client (optionnel)</Label>
            <Select value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? "" : v)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Lier à un client…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
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
          <Button onClick={() => void handleSave()} disabled={!valid || saving}>
            <Pencil className="size-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
