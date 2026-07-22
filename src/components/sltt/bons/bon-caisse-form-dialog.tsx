"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useNav } from "@/lib/nav-store";
import { Badge } from "@/components/ui/badge";
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

type CaisseLigneForm = {
  date: string;
  beneficiaire: string;
  motif: string;
  montant: string;
};

type BonCaisseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextReference: string;
};

export function BonCaisseFormDialog({ open, onOpenChange, nextReference }: BonCaisseFormDialogProps) {
  const { toast } = useToast();
  const addBonSortieCaisse = useStore((state) => state.addBonSortieCaisse);
  const societes = useStore((state) => state.societes);
  const selectedSocieteId = useNav((state) => state.selectedSocieteId);

  const todayIso = new Date().toISOString().slice(0, 10);

  const [caisseDate, setCaisseDate] = useState(todayIso);
  const [caisseSocieteId, setCaisseSocieteId] = useState("");
  const [caisseLignes, setCaisseLignes] = useState<CaisseLigneForm[]>([
    { date: todayIso, beneficiaire: "", motif: "", montant: "" },
  ]);

  const [prevDialogOpen, setPrevDialogOpen] = useState(open);
  if (open !== prevDialogOpen) {
    setPrevDialogOpen(open);
    if (open) {
      setCaisseDate(todayIso);
      setCaisseSocieteId(selectedSocieteId ?? societes[0]?.id ?? "");
      setCaisseLignes([{ date: todayIso, beneficiaire: "", motif: "", montant: "" }]);
    }
  }

  const caisseTotalSaisi = caisseLignes.reduce((sum, ligne) => sum + (Number(ligne.montant) || 0), 0);
  const caisseValid =
    !!caisseSocieteId &&
    caisseLignes.length > 0 &&
    caisseLignes.every((ligne) => ligne.beneficiaire.trim() && ligne.motif.trim() && Number(ligne.montant) > 0);

  function addCaisseLigne() {
    setCaisseLignes((lignes) => [...lignes, { date: caisseDate, beneficiaire: "", motif: "", montant: "" }]);
  }

  function removeCaisseLigne(index: number) {
    setCaisseLignes((lignes) => lignes.filter((_, ligneIndex) => ligneIndex !== index));
  }

  function updateCaisseLigne(
    index: number,
    field: keyof CaisseLigneForm,
    value: string,
  ) {
    setCaisseLignes((lignes) =>
      lignes.map((ligne, ligneIndex) => (ligneIndex === index ? { ...ligne, [field]: value } : ligne)),
    );
  }

  async function handleCreateCaisse() {
    if (!caisseValid) return;
    try {
      const bon = await addBonSortieCaisse({
        date: caisseDate,
        societeId: caisseSocieteId,
        lignes: caisseLignes.map((ligne) => ({
          date: ligne.date,
          beneficiaire: ligne.beneficiaire.trim(),
          motif: ligne.motif.trim(),
          montant: Number(ligne.montant) || 0,
        })),
      });
      toast({
        title: "Bon de sortie créé",
        description: `${bon.reference} — ${formatFCFA(bon.montantTotal)}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le bon de sortie.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle>Nouvelle sortie de caisse</DialogTitle>
            <Badge
              variant="outline"
              className="border-slate-200 dark:border-slate-700 bg-slate-50 font-mono text-xs text-slate-500 dark:text-slate-400"
            >
              {nextReference}
            </Badge>
          </div>
          <DialogDescription>Décaissement en espèces — indépendant de l’entreposage.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caisse-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Date du bon
            </Label>
            <Input
              id="caisse-date"
              type="date"
              value={caisseDate}
              onChange={(event) => setCaisseDate(event.target.value)}
              className="h-10 w-full sm:w-52"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caisse-societe" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Société <span className="text-red-500">*</span>
            </Label>
            <Select value={caisseSocieteId} onValueChange={setCaisseSocieteId}>
              <SelectTrigger id="caisse-societe" className="h-10 w-full sm:w-52">
                <SelectValue placeholder="Sélectionner une société" />
              </SelectTrigger>
              <SelectContent>
                {societes.map((societe) => (
                  <SelectItem key={societe.id} value={societe.id}>
                    {societe.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Bénéficiaires
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={addCaisseLigne} className="h-8 text-primary">
                <Plus className="size-3.5" />
                Ajouter une ligne
              </Button>
            </div>

            <div className="mb-1 grid grid-cols-[100px_1fr_1fr_110px_24px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <span>Date</span>
              <span>Prénom et Nom</span>
              <span>Motif</span>
              <span className="text-right">Montant</span>
              <span />
            </div>

            <div className="space-y-2">
              {caisseLignes.map((ligne, index) => (
                <div key={index} className="grid grid-cols-[100px_1fr_1fr_110px_24px] items-center gap-2">
                  <Input
                    type="date"
                    value={ligne.date}
                    onChange={(event) => updateCaisseLigne(index, "date", event.target.value)}
                    className="h-9 text-xs"
                  />
                  <Input
                    value={ligne.beneficiaire}
                    onChange={(event) => updateCaisseLigne(index, "beneficiaire", event.target.value)}
                    placeholder="ex. Kamisso"
                    className="h-9 text-sm"
                  />
                  <Input
                    value={ligne.motif}
                    onChange={(event) => updateCaisseLigne(index, "motif", event.target.value)}
                    placeholder="ex. Honoraire huissier"
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={ligne.montant}
                    onChange={(event) => updateCaisseLigne(index, "montant", event.target.value)}
                    placeholder="0"
                    className="h-9 text-right text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeCaisseLigne(index)}
                    disabled={caisseLignes.length === 1}
                    className="flex size-6 items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500 disabled:pointer-events-none"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50/60 dark:bg-slate-800/60 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total</span>
            <span className="text-base font-bold tabular-nums text-blue-700">{formatFCFA(caisseTotalSaisi)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreateCaisse} disabled={!caisseValid}>
            <Check className="size-4" />
            Enregistrer le bon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
