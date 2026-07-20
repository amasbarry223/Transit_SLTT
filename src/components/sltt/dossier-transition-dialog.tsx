"use client";

import { useState } from "react";
import { ShieldCheck, Truck, Banknote } from "lucide-react";
import { useStore, type DossierStatut } from "@/lib/store";
import { resteAPayer, type Dossier, type PaiementMode } from "@/lib/domain-types";
import { formatFCFA, parseAmount } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

export type TransitionType = "dedouaner" | "livrer" | "solder";

export function getNextTransition(statut: DossierStatut): TransitionType | null {
  switch (statut) {
    case "En cours":
      return "dedouaner";
    case "Dédouané":
      return "livrer";
    case "Livré":
      return "solder";
    default:
      return null;
  }
}

export const TRANSITION_META: Record<
  TransitionType,
  {
    title: string;
    description: string;
    confirmLabel: string;
    nextStatut: DossierStatut;
    actionLabel: string;
    actionDescription: string;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  dedouaner: {
    title: "Confirmer le dédouanement",
    description:
      "Les formalités douanières sont complètes. Le dossier passera en attente de livraison.",
    confirmLabel: "Confirmer le dédouanement",
    nextStatut: "Dédouané",
    actionLabel: "→ Dédouané",
    actionDescription:
      "Ce dossier est en attente de dédouanement. Une fois les formalités terminées, confirmez ici.",
    icon: ShieldCheck,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/40",
    borderClass: "border-l-blue-500",
  },
  livrer: {
    title: "Enregistrer la livraison",
    description:
      "La marchandise a été remise au client. Le dossier passera en attente de soldage.",
    confirmLabel: "Confirmer la livraison",
    nextStatut: "Livré",
    actionLabel: "→ Livré",
    actionDescription:
      "La marchandise est dédouanée et prête. Confirmez la livraison pour passer à l'étape suivante.",
    icon: Truck,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/40",
    borderClass: "border-l-indigo-500",
  },
  solder: {
    title: "Solder le dossier",
    description:
      "Enregistrez le paiement final pour clôturer ce dossier définitivement.",
    confirmLabel: "Solder le dossier",
    nextStatut: "Soldé",
    actionLabel: "→ Solder",
    actionDescription:
      "La marchandise a été livrée. Enregistrez le paiement final pour clôturer le dossier.",
    icon: Banknote,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    borderClass: "border-l-emerald-500",
  },
};

const PAIEMENT_MODES: PaiementMode[] = [
  "Espèces",
  "Virement",
  "Mobile Money",
  "Chèque",
];

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

interface TransitionDialogProps {
  dossier: Dossier;
  transition: TransitionType;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export function TransitionDialog({
  dossier,
  transition,
  open,
  onOpenChange,
  onSuccess,
}: TransitionDialogProps) {
  const { toast } = useToast();
  const transitionDossierFn = useStore((s) => s.transitionDossier);
  const meta = TRANSITION_META[transition];
  const reste = resteAPayer(dossier);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [montantRecu, setMontantRecu] = useState(String(reste));
  const [mode, setMode] = useState<PaiementMode>("Espèces");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{
    montantRecu?: string;
    date?: string;
  }>({});

  async function handleConfirm() {
    const errs: { montantRecu?: string; date?: string } = {};

    if (transition === "solder" && reste > 0) {
      const amt = parseAmount(montantRecu);
      if (amt < reste) {
        errs.montantRecu = `Le paiement doit couvrir le solde dû (${formatFCFA(reste)}).`;
      }
      if (!date) errs.date = "La date de paiement est requise.";
    }
    if (transition === "livrer" && !date) {
      errs.date = "La date de livraison est requise.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const montantRecu_n =
      transition === "solder" && reste > 0 ? parseAmount(montantRecu) : undefined;

    // Le dossier n'a pas de colonne dédiée à la date de livraison : on la
    // consigne dans les observations pour ne pas la perdre silencieusement.
    const noteFinale =
      transition === "livrer"
        ? `Livré le ${date}.${note ? ` ${note}` : ""}`
        : note || undefined;

    try {
      await transitionDossierFn(
        dossier.id,
        meta.nextStatut,
        montantRecu_n,
        transition === "solder" ? mode : undefined,
        noteFinale,
        date,
      );
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message || "Impossible de faire évoluer le statut du dossier.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: meta.confirmLabel,
      description: `${dossier.reference} est maintenant "${meta.nextStatut}".`,
    });

    onOpenChange(false);
    setNote("");
    setErrors({});
    onSuccess?.();
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      setErrors({});
      setNote("");
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>
            Dossier <strong>{dossier.reference}</strong> · {dossier.clientNom}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-slate-600 dark:text-slate-300">{meta.description}</p>

        <div className="space-y-4">
          {transition === "solder" && (
            reste > 0 ? (
              <>
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm">
                  <span className="text-amber-700">Reste à payer : </span>
                  <span className="font-bold text-amber-900">
                    {formatFCFA(reste)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="td-montant">Montant reçu *</Label>
                  <div className="relative">
                    <Input
                      id="td-montant"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={montantRecu}
                      onChange={(e) => {
                        setMontantRecu(e.target.value);
                        setErrors((p) => ({ ...p, montantRecu: undefined }));
                      }}
                      className={cn(
                        "h-10 pr-14 text-right tabular-nums",
                        errors.montantRecu && "border-red-400",
                      )}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
                      FCFA
                    </span>
                  </div>
                  {errors.montantRecu && (
                    <p className="text-xs text-red-500">{errors.montantRecu}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Mode de paiement</Label>
                  <Select
                    value={mode}
                    onValueChange={(v) => setMode(v as PaiementMode)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAIEMENT_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm">
                <span className="text-emerald-700 font-medium">Dossier déjà soldé.</span>
                <span className="text-emerald-800"> Aucun paiement supplémentaire requis.</span>
              </div>
            )
          )}

          {(transition === "livrer" || (transition === "solder" && reste > 0)) && (
            <div className="space-y-1.5">
              <Label htmlFor="td-date">
                {transition === "livrer"
                  ? "Date de livraison *"
                  : "Date de paiement *"}
              </Label>
              <Input
                id="td-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrors((p) => ({ ...p, date: undefined }));
                }}
                className={cn("h-10", errors.date && "border-red-400")}
              />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="td-note">Observations (optionnel)</Label>
            <Textarea
              id="td-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notes sur cette transition…"
              className="min-h-[72px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>{meta.confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
