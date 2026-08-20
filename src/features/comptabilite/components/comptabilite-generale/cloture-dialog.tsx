"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClotureCaisse, EntiteComptable } from "@/lib/domain-types";
import {
  computeOperationsTotals,
  filterOperationsByEntite,
  filterOperationsByPeriode,
} from "@/lib/comptabilite-generale";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function dayAfter(dateStr: string) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface ClotureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entite: EntiteComptable;
  dernieresClotures: ClotureCaisse[];
}

export function ClotureDialog({ open, onOpenChange, entite, dernieresClotures }: ClotureDialogProps) {
  const { toast } = useToast();
  const allOperations = useStore((s) => s.operationsComptables);
  const recordClotureCaisse = useStore((s) => s.recordClotureCaisse);

  const derniereCloture = dernieresClotures[0];
  const [periodeDebut, setPeriodeDebut] = useState(firstDayOfMonth);
  const [periodeFin, setPeriodeFin] = useState(today);
  const [soldeConstate, setSoldeConstate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialisation du formulaire à l'ouverture du dialog
    setPeriodeDebut(derniereCloture ? dayAfter(derniereCloture.periodeFin) : firstDayOfMonth());
    setPeriodeFin(today());
    setSoldeConstate("");
    setNote("");
  }, [open, derniereCloture]);

  const soldeTheorique = useMemo(() => {
    const entiteOperations = filterOperationsByEntite(allOperations, entite);
    const periode = filterOperationsByPeriode(entiteOperations, periodeDebut || undefined, periodeFin || undefined);
    return computeOperationsTotals(periode).soldeTheorique;
  }, [allOperations, entite, periodeDebut, periodeFin]);

  const soldeConstateNum = Number(soldeConstate.replace(/\s/g, "")) || 0;
  const ecart = soldeTheorique - soldeConstateNum;

  async function handleSubmit() {
    if (!periodeDebut || !periodeFin || periodeFin < periodeDebut) {
      toastWarning(toast, { title: "Période invalide" });
      return;
    }
    setSubmitting(true);
    try {
      await recordClotureCaisse({
        entiteType: entite.type,
        annexeId: entite.type === "annexe" ? entite.id : undefined,
        societeId: entite.type === "societe" ? entite.id : undefined,
        periodeDebut,
        periodeFin,
        soldeTheorique,
        soldeConstate: soldeConstateNum,
        note: note.trim() || undefined,
      });
      toastSuccess(toast, { title: "Clôture enregistrée", description: ecart === 0 ? "Aucun écart constaté." : `Écart de clôture : ${formatFCFA(ecart)}.` });
      onOpenChange(false);
    } catch (error) {
      toastError(toast, error, { title: "Échec de la clôture", fallback: "Réessayez." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Clôturer la caisse — {entite.label}</DialogTitle>
          <DialogDescription>
            Renseignez le solde compté physiquement (caisse ou relevé bancaire) pour clôturer la période — il sera
            comparé au solde net déjà calculé automatiquement (visible dans le KPI et la colonne du journal).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cl-debut">Période — début</Label>
              <Input id="cl-debut" type="date" value={periodeDebut} onChange={(e) => setPeriodeDebut(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-fin">Période — fin</Label>
              <Input id="cl-fin" type="date" value={periodeFin} onChange={(e) => setPeriodeFin(e.target.value)} className="h-10" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Solde théorique (entrées − sorties de la période)</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{formatFCFA(soldeTheorique)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-constate">
              Solde constaté (FCFA) <span className="text-red-500">*</span>
            </Label>
            <Input id="cl-constate" type="number" value={soldeConstate} onChange={(e) => setSoldeConstate(e.target.value)} placeholder="Compté en caisse / relevé bancaire" className="h-10" />
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Écart de clôture (théorique − constaté)</p>
            <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", ecart === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {formatFCFA(ecart)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-note">Note</Label>
            <Textarea id="cl-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Justification de l'écart, référence du relevé…" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting || !soldeConstate}>Clôturer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
