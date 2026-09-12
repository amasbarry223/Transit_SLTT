"use client";

import { Info, Pencil, Save, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useStore } from "@/lib/store";
import type { Devis } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { resolveDossierCoutLabels, resolveTransitSociete } from "@/lib/societe-brand";
import { UI } from "@/shared/utils/ui-messages";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

export function DevisEditForm({
  devis, clients, fClientId, handleClientChange,
  fPortId, setFPortId,
  fNature, setFNature, fDroitDouane, setFDroitDouane, fFraisCircuit, setFFraisCircuit,
  fFraisPrestation, setFFraisPrestation, fDateValidite, setFDateValidite, fNotes,
  setFNotes, editTotal, handleCancelEdit, handleSave, saving = false,
  annexeCode,
}: {
  devis: Devis;
  clients: { id: string; nom: string }[];
  /** Code annexe (ML/CI) du devis — détermine les intitulés des rubriques (ex. « Frais transit port » en Côte d'Ivoire). */
  annexeCode?: string | null;
  fClientId: string;
  handleClientChange: (id: string) => void;
  fPortId: string;
  setFPortId: Dispatch<SetStateAction<string>>;
  fNature: string;
  setFNature: Dispatch<SetStateAction<string>>;
  fDroitDouane: string;
  setFDroitDouane: Dispatch<SetStateAction<string>>;
  fFraisCircuit: string;
  setFFraisCircuit: Dispatch<SetStateAction<string>>;
  fFraisPrestation: string;
  setFFraisPrestation: Dispatch<SetStateAction<string>>;
  fDateValidite: string;
  setFDateValidite: Dispatch<SetStateAction<string>>;
  fNotes: string;
  setFNotes: Dispatch<SetStateAction<string>>;
  editTotal: number;
  handleCancelEdit: () => void;
  handleSave: () => void | Promise<void>;
  saving?: boolean;
}) {
  const societes = useStore((s) => s.societes);
  const ports = useStore((s) => s.ports.filter((p) => p.actif));
  const societeNom = resolveTransitSociete(societes)?.nom || "Transit";
  const labels = resolveDossierCoutLabels(annexeCode);
  return (
        <Card className="border-primary/20 shadow-md overflow-hidden">
          <div className="border-b border-primary/20 bg-primary/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Pencil className="size-3.5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-blue-900 dark:text-blue-200">Modifier le devis — {devis.reference}</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client + Port + Nature */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Client <span className="text-red-500 normal-case">*</span>
                </Label>
                <Select value={fClientId} onValueChange={handleClientChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Nature de la marchandise <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input value={fNature} onChange={(e) => setFNature(e.target.value)}
                  placeholder="ex. Matériaux de construction" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Port d&apos;embarquement / de manutention
                </Label>
                <Select value={fPortId || "__none"} onValueChange={(v) => setFPortId(v === "__none" ? "" : v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Aucun</SelectItem>
                    {ports.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                        {p.ville ? ` — ${p.ville}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Montants */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Estimation financière</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: labels.droitDouane, hint: labels.droitDouaneHint, val: fDroitDouane, set: setFDroitDouane },
                  { label: labels.fraisCircuit, hint: labels.fraisCircuitHint, val: fFraisCircuit, set: setFFraisCircuit },
                  { label: `${labels.fraisPrestation} — ${societeNom}`, hint: labels.fraisPrestationHint, val: fFraisPrestation, set: setFFraisPrestation },
                ].map((f) => (
                  <div key={f.label} className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {f.label}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <Info className="size-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">{f.hint}</TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input value={f.val} onChange={(e) => f.set(e.target.value)}
                      placeholder={UI.placeholders.amountFCFA} className="h-10 text-right tabular-nums" />
                  </div>
                ))}
              </div>
              {editTotal > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 px-4 py-3">
                  <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Total estimé</span>
                  <span className="text-lg font-extrabold tabular-nums text-blue-900 dark:text-blue-200">{formatFCFA(editTotal)}</span>
                </div>
              )}
            </div>

            {/* Date + Notes */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Date de validité <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input type="date" value={fDateValidite}
                  onChange={(e) => setFDateValidite(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notes</Label>
                <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Conditions, remarques..." rows={3} className="resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-5">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleCancelEdit}>
                <X className="mr-2 size-4" /> Annuler
              </Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90"
                disabled={!fClientId || !fNature.trim() || !fDateValidite || saving}
                onClick={() => void handleSave()}>
                <Save className="size-4" /> {saving ? "Enregistrement…" : "Enregistrer les modifications"}
              </Button>
            </div>
          </div>
        </Card>
  );
}
