import type { Client, Dossier, PaiementMode, Societe } from "@/lib/domain-types";
import { UI } from "@/lib/ui-messages";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
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

interface NewEcritureDialogProps {
  open: boolean;
  clients: Client[];
  societes: Societe[];
  clientDossiers: Dossier[];
  clientId: string;
  dossierId: string;
  investi: string;
  paye: string;
  mode: PaiementMode;
  date: string;
  note: string;
  societeId: string;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onClientChange: (id: string) => void;
  onDossierChange: (id: string) => void;
  onInvestiChange: (value: string) => void;
  onPayeChange: (value: string) => void;
  onModeChange: (value: PaiementMode) => void;
  onDateChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSocieteChange: (id: string) => void;
  onCreate: () => void;
}

export function NewEcritureDialog(props: NewEcritureDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle écriture comptable</DialogTitle>
          <DialogDescription>Sélectionnez un client et saisissez les montants investi et payé.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ne-client" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Client <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={props.clientId} onValueChange={props.onClientChange}>
                <SelectTrigger id="ne-client" className="h-10 w-full"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>{props.clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>)}</SelectContent>
              </Select>
              <QuickClientButton onCreated={props.onClientChange} />
            </div>
          </div>
          {props.clientDossiers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ne-dossier" className="text-sm font-medium text-slate-700 dark:text-slate-300">Dossier lié (optionnel)</Label>
              <Select value={props.dossierId} onValueChange={props.onDossierChange}>
                <SelectTrigger id="ne-dossier" className="h-10 w-full"><SelectValue placeholder="Aucun dossier lié" /></SelectTrigger>
                <SelectContent>
                  {props.clientDossiers.map((dossier) => <SelectItem key={dossier.id} value={dossier.id}>{dossier.reference} — {dossier.nature}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ne-investi" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Montant investi (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input id="ne-investi" type="number" value={props.investi} onChange={(event) => props.onInvestiChange(event.target.value)} placeholder={UI.placeholders.amountFCFA} className="h-10" disabled={!!props.dossierId} />
              {props.dossierId && <p className="text-xs text-slate-400 dark:text-slate-500">Verrouillé sur le montant investi du dossier lié.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ne-paye" className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant payé (FCFA)</Label>
              <Input id="ne-paye" type="number" value={props.paye} onChange={(event) => props.onPayeChange(event.target.value)} placeholder={UI.placeholders.amountFCFA} className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ne-mode" className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode de paiement</Label>
              <Select value={props.mode} onValueChange={(value) => props.onModeChange(value as PaiementMode)}>
                <SelectTrigger id="ne-mode" className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{modeOptions.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ne-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</Label>
              <Input id="ne-date" type="date" value={props.date} onChange={(event) => props.onDateChange(event.target.value)} className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Société (optionnel)</Label>
            <Select value={props.societeId || "none"} onValueChange={(value) => props.onSocieteChange(value === "none" ? "" : value)}>
              <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Aucune (transit)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune (transit)</SelectItem>
                {props.societes.map((societe) => <SelectItem key={societe.id} value={societe.id}>{societe.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ne-note" className="text-sm font-medium text-slate-700 dark:text-slate-300">Note</Label>
            <Textarea id="ne-note" value={props.note} onChange={(event) => props.onNoteChange(event.target.value)} rows={3} placeholder="Référence, acompte…" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={props.submitting}>Annuler</Button>
          <Button onClick={props.onCreate} disabled={!props.clientId || !props.investi || props.submitting}>Créer l&apos;écriture</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
