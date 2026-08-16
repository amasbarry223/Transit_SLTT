"use client";

import { Pencil, Save, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Devis } from "@/lib/store";
import type { Societe } from "@/lib/domain-types";
import { formatFCFA } from "@/lib/format";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DevisEditForm({
  devis, societes, clients, fSocieteId, setFSocieteId, fClientId, handleClientChange,
  fNature, setFNature, fDroitDouane, setFDroitDouane, fFraisCircuit, setFFraisCircuit,
  fFraisPrestation, setFFraisPrestation, fDateValidite, setFDateValidite, fNotes,
  setFNotes, editTotal, handleCancelEdit, handleSave,
}: {
  devis: Devis;
  societes: Societe[];
  clients: { id: string; nom: string }[];
  fSocieteId: string;
  setFSocieteId: Dispatch<SetStateAction<string>>;
  fClientId: string;
  handleClientChange: (id: string) => void;
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
  handleSave: () => void;
}) {
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
            {/* Société */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Société <span className="text-red-500 normal-case">*</span>
              </Label>
              <Select value={fSocieteId || undefined} onValueChange={setFSocieteId}>
                <SelectTrigger className="h-10" aria-label="Sélectionner une société">
                  <SelectValue placeholder="Sélectionner une société" />
                </SelectTrigger>
                <SelectContent>
                  {societes
                    .filter((s) => s.actif || s.id === devis.societeId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client + Nature */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
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
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Nature de la marchandise <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input value={fNature} onChange={(e) => setFNature(e.target.value)}
                  placeholder="ex. Matériaux de construction" className="h-10" />
              </div>
            </div>

            {/* Montants */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estimation financière</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Droits de douane (FCFA)", val: fDroitDouane, set: setFDroitDouane },
                  { label: "Frais de circuit (FCFA)",  val: fFraisCircuit, set: setFFraisCircuit },
                  { label: "Prestation SLTT (FCFA)",   val: fFraisPrestation, set: setFFraisPrestation },
                ].map((f) => (
                  <div key={f.label} className="space-y-2">
                    <Label className="text-xs text-slate-500 dark:text-slate-400">{f.label}</Label>
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
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Date de validité <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input type="date" value={fDateValidite}
                  onChange={(e) => setFDateValidite(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</Label>
                <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Conditions, remarques..." rows={3} className="resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-5">
              <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={handleCancelEdit}>
                <X className="mr-2 size-4" /> Annuler
              </Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90"
                disabled={!fSocieteId || !fClientId || !fNature.trim() || !fDateValidite}
                onClick={handleSave}>
                <Save className="size-4" /> Enregistrer les modifications
              </Button>
            </div>
          </div>
        </Card>
  );
}
