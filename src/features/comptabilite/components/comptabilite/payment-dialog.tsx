import { Wallet } from "lucide-react";
import type { Ecriture, PaiementMode } from "@/lib/store";
import { resteAPayer } from "@/lib/domain-types";
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
import { Textarea } from "@/components/ui/textarea";
import { modeOptions } from "./shared";

interface PaymentDialogProps {
  open: boolean;
  selected: Ecriture | null;
  montant: string;
  mode: PaiementMode;
  datePaiement: string;
  note: string;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onMontantChange: (value: string) => void;
  onModeChange: (value: PaiementMode) => void;
  onDateChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onValidate: () => void;
}

export function PaymentDialog(props: PaymentDialogProps) {
  const { selected } = props;
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          {selected && <DialogDescription>{selected.clientNom} · {selected.id}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          {selected && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700">
              <AmountRow label="Montant investi" value={formatFCFA(selected.montantInvesti)} />
              <AmountRow label="Déjà payé" value={formatFCFA(selected.montantPaye)} className="mt-1.5 text-emerald-600 dark:text-emerald-400" />
              <AmountRow label="Reste à payer" value={formatFCFA(resteAPayer(selected))} className="mt-1.5 border-t border-slate-200 pt-1.5 font-semibold text-amber-600 dark:border-slate-700 dark:text-amber-400" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="montant" className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant</Label>
            <div className="relative">
              <Input id="montant" inputMode="numeric" value={props.montant} onChange={(event) => props.onMontantChange(event.target.value)} className="h-10 pr-16 tabular-nums" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500">FCFA</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode de paiement</Label>
            <Select value={props.mode} onValueChange={(value) => props.onModeChange(value as PaiementMode)}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{modeOptions.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</Label>
            <Input id="date" type="date" value={props.datePaiement} onChange={(event) => props.onDateChange(event.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-slate-700 dark:text-slate-300">Note</Label>
            <Textarea id="note" value={props.note} onChange={(event) => props.onNoteChange(event.target.value)} rows={3} placeholder="Référence, acompte, complément d'information…" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={props.submitting}>Annuler</Button>
          <Button onClick={props.onValidate} disabled={props.submitting}><Wallet className="size-4" />Valider le paiement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AmountRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
