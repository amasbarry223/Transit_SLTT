"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Client, StockItemInput } from "@/lib/store";
import type { Annexe } from "@/lib/domain-types";
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
 * Formulaire à une seule étape (pas d'assistant) — même convention que les
 * autres dialogues de création de l'app (Client, Fournisseur…) : un nombre
 * de champs comparable ne justifiait pas les 3 étapes de l'ancienne version
 * (cf. audit de simplicité).
 */
export function NewItemDialog({
  open,
  onOpenChange,
  annexes,
  clients,
  defaultAnnexeId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annexes: Annexe[];
  clients: Client[];
  defaultAnnexeId: string;
  onSubmit: (input: StockItemInput) => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [niMarchandise, setNiMarchandise] = useState("");
  const [niUnite, setNiUnite] = useState("");
  const [niQuantite, setNiQuantite] = useState("0");
  const [niSeuil, setNiSeuil] = useState("10");
  const [niHotesse, setNiHotesse] = useState("");
  const [niCommercial, setNiCommercial] = useState("");
  const [niValeurTotale, setNiValeurTotale] = useState("0");
  const [niSommePayee, setNiSommePayee] = useState("0");
  const [niClientId, setNiClientId] = useState<string>("");
  const [niAnnexeId, setNiAnnexeId] = useState<string>(defaultAnnexeId);

  const valid = Boolean(niAnnexeId && niUnite.trim());

  async function handleAddStockItem() {
    if (saving || !valid) return;
    const marchandise = niMarchandise.trim() || "—";
    const unite = niUnite.trim();
    // Number("-5") est truthy, donc `|| 0` ne filtre pas les montants/quantités
    // négatifs saisis manuellement (le `min={0}` des <Input> n'est
    // qu'indicatif) — sans Math.max(0, …), un stock ou une valeur négative se
    // glisserait dans l'article créé et fausserait le KPI "Valeur du stock".
    const valeurTotale = Math.max(0, Number(niValeurTotale) || 0);
    // Plafonnée à la valeur totale — sinon sommePayee + resteAPayer (utilisé
    // pour le KPI "Valeur du stock") dépasserait la valeur réelle de l'article.
    const sommePayee = Math.min(Math.max(0, Number(niSommePayee) || 0), valeurTotale);
    const input: StockItemInput = {
      marchandise,
      quantite: Math.max(0, Number(niQuantite) || 0),
      unite,
      seuil: Math.max(0, Number(niSeuil) || 10),
      depositaire: niHotesse.trim() || "—",
      commercial: niCommercial.trim() || "—",
      sommePayee,
      resteAPayer: Math.max(0, valeurTotale - sommePayee),
      // Date de l'article fixée automatiquement à aujourd'hui — corrigeable
      // ensuite via le modal d'édition si l'article est saisi rétroactivement.
      date: new Date().toISOString().slice(0, 10),
      clientId: niClientId || undefined,
      annexeId: niAnnexeId,
    };
    setSaving(true);
    try {
      await onSubmit(input);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel article</DialogTitle>
          <DialogDescription>
            Enregistrez un nouveau type de marchandise dans le stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Marchandise">
              <Input
                value={niMarchandise}
                onChange={(e) => setNiMarchandise(e.target.value)}
                placeholder="ex. Riz parfumé 25 kg"
                className="h-10"
                autoFocus
              />
            </FormField>
          </div>

          {annexes.length > 1 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/90">
                Annexe <span className="text-red-500">*</span>
              </Label>
              <Select value={niAnnexeId} onValueChange={setNiAnnexeId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une annexe" />
                </SelectTrigger>
                <SelectContent>
                  {annexes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground/90">Client (optionnel)</Label>
            <Select value={niClientId || "none"} onValueChange={(v) => setNiClientId(v === "none" ? "" : v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Lier à un client…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormField label="Unité" required>
            <Input
              value={niUnite}
              onChange={(e) => setNiUnite(e.target.value)}
              placeholder="ex. sacs, kg, L"
              className="h-10"
            />
          </FormField>

          <FormField label="Quantité initiale">
            <Input
              type="number"
              min={0}
              value={niQuantite}
              onChange={(e) => setNiQuantite(e.target.value)}
              className="h-10"
            />
          </FormField>

          <FormField label="Seuil d'alerte" hint="En dessous de cette quantité, l'article apparaît dans les alertes de stock faible.">
            <Input
              type="number"
              min={0}
              value={niSeuil}
              onChange={(e) => setNiSeuil(e.target.value)}
              className="h-10"
            />
          </FormField>

          <FormField label="Hôtesse">
            <Input
              value={niHotesse}
              onChange={(e) => setNiHotesse(e.target.value)}
              placeholder="Nom de l'hôtesse"
              className="h-10"
            />
          </FormField>

          <FormField label="Commercial">
            <Input
              value={niCommercial}
              onChange={(e) => setNiCommercial(e.target.value)}
              placeholder="Nom du commercial"
              className="h-10"
            />
          </FormField>

          <FormField label="Valeur totale de la marchandise (FCFA)">
            <Input
              type="number"
              min={0}
              value={niValeurTotale}
              onChange={(e) => setNiValeurTotale(e.target.value)}
              className="h-10"
            />
          </FormField>

          <FormField label="Somme payée (FCFA)">
            <Input
              type="number"
              min={0}
              value={niSommePayee}
              onChange={(e) => setNiSommePayee(e.target.value)}
              className="h-10"
            />
          </FormField>

          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border px-3 py-2.5 bg-muted/40">
            <span className="text-sm text-muted-foreground">Reste à payer</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatFCFA(Math.max(0, (Number(niValeurTotale) || 0) - (Number(niSommePayee) || 0)))}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={() => void handleAddStockItem()} disabled={!valid || saving}>
            <Plus className="size-4" />
            {saving ? "Ajout en cours…" : "Ajouter au stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
