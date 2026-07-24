"use client";

import * as React from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { useStore, type Facture } from "@/lib/store";
import { resteAPayer } from "@/lib/domain-types";
import { formatFCFA } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
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
import { cn } from "@/lib/utils";

export function PaiementDialog({
  facture,
  open,
  onOpenChange,
}: {
  facture: Facture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const recordPaiement = useStore((s) => s.recordFacturePaiement);
  const reste = resteAPayer({ montantInvesti: facture.montantTTC, montantPaye: facture.montantPaye });
  const [montant, setMontant] = React.useState(String(reste));
  const [saving, setSaving] = React.useState(false);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setMontant(String(reste));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!m || m <= 0) {
      toast({ title: "Montant invalide", description: "Le montant doit être supérieur à 0.", variant: "destructive" });
      return;
    }
    if (m > reste) {
      toast({
        title: "Montant trop élevé",
        description: `Le reste à payer est de ${reste.toLocaleString("fr-FR")} FCFA.`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await recordPaiement(facture.id, m);
      toast({ title: "Paiement enregistré", description: `${m.toLocaleString("fr-FR")} FCFA encaissés.` });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer le paiement.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-labelledby="paiement-dialog-title">
        <DialogHeader>
          <DialogTitle id="paiement-dialog-title" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
              <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            Facture <span className="font-mono font-semibold">{facture.numero}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Total TTC", value: formatFCFA(facture.montantTTC), color: "text-slate-700 dark:text-slate-300" },
              { label: "Déjà payé", value: formatFCFA(facture.montantPaye), color: "text-emerald-700 dark:text-emerald-400" },
              { label: "Reste", value: formatFCFA(reste), color: "text-amber-700 dark:text-amber-400" },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-xl border border-border/60 bg-slate-50/80 p-2 dark:bg-slate-800/50 sm:p-3">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className={cn("mt-1 break-words text-xs font-bold tabular-nums sm:text-sm", item.color)}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paiement-montant" className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Montant reçu (FCFA)
            </Label>
            <Input
              id="paiement-montant"
              type="number"
              min="1"
              max={reste}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              autoFocus
              className="h-11 text-right text-base font-semibold tabular-nums"
              required
            />
            <div className="flex gap-2">
              {[25, 50, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setMontant(String(Math.round((reste * pct) / 100)))}
                  className="rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800"
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMontant(String(reste))}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40"
              >
                Solde
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle2 className="mr-1.5 size-3.5" />
              {saving ? "Enregistrement…" : "Valider le paiement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
