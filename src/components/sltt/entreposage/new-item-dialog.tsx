"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { Client, Societe, StockItemInput } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
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

export function NewItemDialog({
  open,
  onOpenChange,
  societes,
  clients,
  defaultSocieteId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  societes: Societe[];
  clients: Client[];
  defaultSocieteId: string;
  onSubmit: (input: StockItemInput) => void;
}) {
  const [niMarchandise, setNiMarchandise] = useState("");
  const [niUnite, setNiUnite] = useState("");
  const [niQuantite, setNiQuantite] = useState("0");
  const [niSeuil, setNiSeuil] = useState("10");
  const [niDepositaire, setNiDepositaire] = useState("");
  const [niCommercial, setNiCommercial] = useState("");
  const [niValeurTotale, setNiValeurTotale] = useState("0");
  const [niSommePayee, setNiSommePayee] = useState("0");
  const [niClientId, setNiClientId] = useState<string>("");
  const [niSocieteId, setNiSocieteId] = useState<string>(defaultSocieteId);
  const [niAdvancedOpen, setNiAdvancedOpen] = useState(false);

  function handleAddStockItem() {
    const marchandise = niMarchandise.trim();
    const unite = niUnite.trim();
    if (!marchandise || !unite || !niSocieteId) return;
    const valeurTotale = Number(niValeurTotale) || 0;
    // Plafonnée à la valeur totale — sinon sommePayee + resteAPayer (utilisé
    // pour le KPI "Valeur du stock") dépasserait la valeur réelle de l'article.
    const sommePayee = Math.min(Number(niSommePayee) || 0, valeurTotale);
    const input: StockItemInput = {
      marchandise,
      quantite: Number(niQuantite) || 0,
      unite,
      seuil: Number(niSeuil) || 10,
      depositaire: niDepositaire.trim() || "—",
      commercial: niCommercial.trim() || "—",
      sommePayee,
      resteAPayer: Math.max(0, valeurTotale - sommePayee),
      clientId: niClientId || undefined,
      societeId: niSocieteId,
    };
    onSubmit(input);
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
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="ni-marchandise" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Marchandise <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ni-marchandise"
              value={niMarchandise}
              onChange={(e) => setNiMarchandise(e.target.value)}
              placeholder="ex. Riz parfumé 25 kg"
              className="h-10"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Société <span className="text-red-500">*</span>
            </Label>
            <Select value={niSocieteId} onValueChange={setNiSocieteId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Sélectionner une société" />
              </SelectTrigger>
              <SelectContent>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Client (optionnel)
            </Label>
            <Select value={niClientId || "none"} onValueChange={(v) => setNiClientId(v === "none" ? "" : v)}>
              <SelectTrigger className="h-10">
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

          <div className="space-y-2">
            <Label htmlFor="ni-unite" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Unité <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ni-unite"
              value={niUnite}
              onChange={(e) => setNiUnite(e.target.value)}
              placeholder="ex. sacs, kg, L"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ni-quantite" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Quantité initiale
            </Label>
            <Input
              id="ni-quantite"
              type="number"
              min={0}
              value={niQuantite}
              onChange={(e) => setNiQuantite(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ni-seuil" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Seuil d&apos;alerte
            </Label>
            <Input
              id="ni-seuil"
              type="number"
              min={0}
              value={niSeuil}
              onChange={(e) => setNiSeuil(e.target.value)}
              className="h-10"
            />
          </div>

        </div>

        <button
          type="button"
          onClick={() => setNiAdvancedOpen((v) => !v)}
          aria-expanded={niAdvancedOpen}
          className="flex w-full items-center justify-between gap-2 border-t border-border pt-3 text-left text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Dépositaire, commercial et paiement (optionnel)
          <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", niAdvancedOpen && "rotate-180")} />
        </button>

        {niAdvancedOpen && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ni-depositaire" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Dépositaire
              </Label>
              <Input
                id="ni-depositaire"
                value={niDepositaire}
                onChange={(e) => setNiDepositaire(e.target.value)}
                placeholder="Nom du dépositaire"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ni-commercial" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Commercial
              </Label>
              <Input
                id="ni-commercial"
                value={niCommercial}
                onChange={(e) => setNiCommercial(e.target.value)}
                placeholder="Nom du commercial"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ni-valeur" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Valeur totale de la marchandise (FCFA)
              </Label>
              <Input
                id="ni-valeur"
                type="number"
                min={0}
                value={niValeurTotale}
                onChange={(e) => setNiValeurTotale(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ni-payee" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Somme payée (FCFA)
              </Label>
              <Input
                id="ni-payee"
                type="number"
                min={0}
                value={niSommePayee}
                onChange={(e) => setNiSommePayee(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Reste à payer
              </Label>
              <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatFCFA(Math.max(0, (Number(niValeurTotale) || 0) - (Number(niSommePayee) || 0)))}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleAddStockItem}
            disabled={!niMarchandise.trim() || !niUnite.trim() || !niSocieteId}
          >
            <Plus className="size-4" />
            Ajouter au stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
