"use client";

import { Pencil, Plus, X } from "lucide-react";
import type { Facture, Societe } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { DEFAULT_TVA_RATE } from "@/lib/domain-types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FinancialSummary } from "./financial-summary";
import type { useFactureEditState } from "./use-facture-edit-state";

export function FactureEditForm({
  facture,
  societes,
  editState,
}: {
  facture: Facture;
  societes: Societe[];
  editState: ReturnType<typeof useFactureEditState>;
}) {
  const {
    editDate,
    setEditDate,
    editDateEcheance,
    setEditDateEcheance,
    editTvaOn,
    setEditTvaOn,
    editSocieteId,
    setEditSocieteId,
    editNotes,
    setEditNotes,
    editLignes,
    setEditLignes,
    editMontantHT,
    editTVA,
    editTTC,
  } = editState;

  return (
    <Card className="overflow-hidden border-blue-200 shadow-md">
      <div className="border-b border-blue-100 bg-blue-50/80 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/30">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Pencil className="size-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-blue-900 dark:text-blue-100">
              Modifier la facture — {facture.numero}
            </h2>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              Seules les factures en brouillon peuvent être modifiées
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Date d'émission</Label>
            <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Date d'échéance</Label>
            <Input
              type="date"
              value={editDateEcheance}
              onChange={(e) => setEditDateEcheance(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Société</Label>
            <select
              value={editSocieteId}
              onChange={(e) => setEditSocieteId(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-border bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">— Aucune (transit) —</option>
              {societes.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
          <Label htmlFor="edit-tva-switch" className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Appliquer la TVA ({DEFAULT_TVA_RATE} %)
          </Label>
          <Switch id="edit-tva-switch" checked={editTvaOn} onCheckedChange={setEditTvaOn} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lignes de facturation</p>
            <button
              onClick={() => setEditLignes((l) => [...l, { description: "", quantite: "1", prixUnitaire: "" }])}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              <Plus className="size-3.5" /> Ajouter une ligne
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/80">
            <div className="grid grid-cols-[1fr_72px_120px_120px_36px] gap-x-2 border-b border-border/60 bg-slate-50/80 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:bg-slate-800/50">
              <span>Description</span>
              <span className="text-center">Qté</span>
              <span className="text-right">P.U. HT</span>
              <span className="text-right">Total HT</span>
              <span />
            </div>
            <div className="divide-y divide-border/30">
              {editLignes.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_72px_120px_120px_36px] items-center gap-x-2 px-4 py-2.5"
                >
                  <Input
                    value={l.description}
                    onChange={(e) =>
                      setEditLignes((ls) => ls.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))
                    }
                    placeholder="Description de la prestation"
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    min="0.01"
                    value={l.quantite}
                    onChange={(e) =>
                      setEditLignes((ls) => ls.map((x, idx) => (idx === i ? { ...x, quantite: e.target.value } : x)))
                    }
                    className="h-9 text-center text-sm tabular-nums"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={l.prixUnitaire}
                    onChange={(e) =>
                      setEditLignes((ls) =>
                        ls.map((x, idx) => (idx === i ? { ...x, prixUnitaire: e.target.value } : x)),
                      )
                    }
                    className="h-9 text-right text-sm tabular-nums"
                  />
                  <p className="text-right text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                    {formatFCFA(
                      (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaire) || 0),
                    )}
                  </p>
                  <button
                    onClick={() => setEditLignes((ls) => ls.filter((_, idx) => idx !== i))}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <FinancialSummary
            montantHT={facture.montantHT}
            tauxTVA={facture.tauxTVA}
            montantTVA={facture.montantTVA}
            montantTTC={facture.montantTTC}
            montantPaye={facture.montantPaye}
            editMode
            editMontantHT={editMontantHT}
            editTVA={editTVA}
            editTTC={editTTC}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</Label>
          <Textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
            placeholder="Conditions de paiement, remarques…"
          />
        </div>
      </div>
    </Card>
  );
}
