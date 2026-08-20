"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Boxes, Package, Plus, Wallet } from "lucide-react";
import type { Client, Societe, StockItemInput } from "@/lib/store";
import type { Annexe } from "@/lib/domain-types";
import { TOP_DOUMANI_SOCIETE_NOM } from "@/lib/comptabilite-generale";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
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

type StepId = 1 | 2 | 3;

const STEPS: {
  id: StepId;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "indigo" | "emerald";
}[] = [
  { id: 1, label: "Article", hint: "Marchandise, société, client", icon: Package, tone: "blue" },
  { id: 2, label: "Stock", hint: "Unité, quantité, seuil d'alerte", icon: Boxes, tone: "indigo" },
  { id: 3, label: "Suivi", hint: "Dépositaire, commercial, paiement", icon: Wallet, tone: "emerald" },
];

const toneMap: Record<"blue" | "indigo" | "emerald", string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
};

export function NewItemDialog({
  open,
  onOpenChange,
  societes,
  annexes,
  clients,
  defaultSocieteId,
  defaultAnnexeId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  societes: Societe[];
  annexes: Annexe[];
  clients: Client[];
  defaultSocieteId: string;
  defaultAnnexeId: string;
  onSubmit: (input: StockItemInput) => void | Promise<void>;
}) {
  const [step, setStep] = useState<StepId>(1);
  const [saving, setSaving] = useState(false);
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
  const [niAnnexeId, setNiAnnexeId] = useState<string>(defaultAnnexeId);

  // Top Doumani n'opère que sur l'annexe Mali — pas de choix à proposer.
  // On masque le sélecteur et on se cale silencieusement sur l'annexe par
  // défaut (celle du contexte courant, déjà résolue par l'écran parent).
  const isTopDoumani = societes.find((s) => s.id === niSocieteId)?.nom === TOP_DOUMANI_SOCIETE_NOM;
  const resolvedNiAnnexeId = isTopDoumani ? defaultAnnexeId : niAnnexeId;

  const step1Valid = Boolean(niSocieteId && resolvedNiAnnexeId);
  const step2Valid = Boolean(niUnite.trim());
  const canLeaveStep = step === 1 ? step1Valid : step === 2 ? step2Valid : true;

  function goNext() {
    if (!canLeaveStep) return;
    setStep((s) => (s < 3 ? ((s + 1) as StepId) : s));
  }

  function goPrev() {
    setStep((s) => (s > 1 ? ((s - 1) as StepId) : s));
  }

  async function handleAddStockItem() {
    if (saving) return;
    const marchandise = niMarchandise.trim() || "—";
    const unite = niUnite.trim();
    if (!unite || !niSocieteId || !resolvedNiAnnexeId) return;
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
      depositaire: niDepositaire.trim() || "—",
      commercial: niCommercial.trim() || "—",
      sommePayee,
      resteAPayer: Math.max(0, valeurTotale - sommePayee),
      clientId: niClientId || undefined,
      societeId: niSocieteId,
      annexeId: resolvedNiAnnexeId,
    };
    setSaving(true);
    try {
      await onSubmit(input);
    } finally {
      setSaving(false);
    }
  }

  const current = STEPS[step - 1];
  const CurrentIcon = current.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel article</DialogTitle>
          <DialogDescription>
            Enregistrez un nouveau type de marchandise dans le stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Étape {step} sur {STEPS.length} — {current.label}
            </span>
            <span className="hidden sm:inline">{current.hint}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-200",
                  s.id <= step ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              toneMap[current.tone],
            )}
          >
            <CurrentIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{current.label}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{current.hint}</p>
          </div>
        </div>

        {step === 1 && (
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

            <div className="sm:col-span-2 space-y-2">
              <Label className="text-sm font-medium text-foreground/90">
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

            {annexes.length > 1 && !isTopDoumani && (
              <div className="sm:col-span-2 space-y-2">
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

            <div className="sm:col-span-2 space-y-2">
              <Label className="text-sm font-medium text-foreground/90">
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
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Unité" required>
              <Input
                value={niUnite}
                onChange={(e) => setNiUnite(e.target.value)}
                placeholder="ex. sacs, kg, L"
                className="h-10"
                autoFocus
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
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Dépositaire">
              <Input
                value={niDepositaire}
                onChange={(e) => setNiDepositaire(e.target.value)}
                placeholder="Nom du dépositaire"
                className="h-10"
                autoFocus
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
        )}

        <DialogFooter className="gap-2 sm:justify-between sm:gap-0">
          <Button
            variant="outline"
            onClick={step === 1 ? () => onOpenChange(false) : goPrev}
          >
            {step === 1 ? (
              "Annuler"
            ) : (
              <>
                <ArrowLeft className="size-4" />
                Précédent
              </>
            )}
          </Button>
          {step < 3 ? (
            <Button onClick={goNext} disabled={!canLeaveStep}>
              Suivant
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={() => void handleAddStockItem()} disabled={!step1Valid || !step2Valid || saving}>
              <Plus className="size-4" />
              {saving ? "Ajout en cours…" : "Ajouter au stock"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
