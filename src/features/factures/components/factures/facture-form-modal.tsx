"use client";

import * as React from "react";
import { Plus, Receipt, X } from "lucide-react";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type FactureInput } from "@/lib/store";
import { DEFAULT_TVA_RATE } from "@/lib/domain-types";
import { useNav } from "@/lib/nav-store";
import { useToast } from "@/hooks/use-toast";
import { toastError } from "@/lib/toast-helpers";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { formatFCFA } from "@/lib/format";
import { shouldShowTva } from "@/lib/export";
import { resolveDossierCoutLabels, shouldShowAnnexeForSociete } from "@/lib/societe-brand";
import { FACTURE_ECHEANCE_JOURS, MS_PER_DAY } from "@/lib/constants";

interface LigneForm { description: string; quantite: string; prixUnitaire: string; }

const EMPTY_LIGNE: LigneForm = { description: "", quantite: "1", prixUnitaire: "" };

export function FactureFormModal({
  open,
  onClose,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: Partial<FactureInput>;
}) {
  const clients    = useStore((s) => s.clients);
  const dossiers   = useStore((s) => s.dossiers);
  const societes   = useStore((s) => s.societes);
  const addFacture = useStore((s) => s.addFacture);
  const go         = useNav((s) => s.go);
  const { toast }  = useToast();
  const { annexes, activeAnnexeId } = useActiveAnnexe();

  const today    = new Date().toISOString().slice(0, 10);
  const defaultDueDate = new Date(
    Date.now() + FACTURE_ECHEANCE_JOURS * MS_PER_DAY,
  )
    .toISOString()
    .slice(0, 10);

  const [clientId,     setClientId]     = React.useState(prefill?.clientId ?? "");
  const [clientNom,    setClientNom]    = React.useState(prefill?.clientNom ?? "");
  const [societeId,    setSocieteId]    = React.useState(prefill?.societeId ?? "");
  const [annexeId,     setAnnexeId]     = React.useState(prefill?.annexeId ?? activeAnnexeId ?? "");
  const [dossierId,    setDossierId]    = React.useState(prefill?.dossierId ?? "");
  const [date,         setDate]         = React.useState(prefill?.date ?? today);
  const [dateEcheance, setDateEcheance] = React.useState(prefill?.dateEcheance ?? defaultDueDate);
  const [tvaOn,        setTvaOn]        = React.useState((prefill?.tauxTVA ?? DEFAULT_TVA_RATE) > 0);
  const [notes,        setNotes]        = React.useState(prefill?.notes ?? "");
  const [saving,       setSaving]       = React.useState(false);
  const tauxTVA = tvaOn ? String(DEFAULT_TVA_RATE) : "0";
  const [lignes,       setLignes]       = React.useState<LigneForm[]>(
    prefill?.lignes?.map((l) => ({
      description: l.description,
      quantite: String(l.quantite),
      prixUnitaire: String(l.prixUnitaire),
    })) ?? [{ ...EMPTY_LIGNE }]
  );

  // Top Doumani (et toute société hors transit) n'a pas de découpage par
  // annexe — masquer le champ plutôt que de faire choisir une annexe qui ne
  // s'applique pas à cette société (même règle que contrats/bons de caisse).
  const showAnnexe = shouldShowAnnexeForSociete(societeId, societes, annexes);
  const resolvedAnnexeId = showAnnexe ? annexeId : (activeAnnexeId ?? "");

  // Seules les lignes avec une description non vide sont envoyées à
  // addFacture (voir handleSubmit) — le total affiché doit porter sur le même
  // sous-ensemble, sinon une ligne sans description mais avec quantité/prix
  // renseignés gonfle le total affiché puis disparaît silencieusement de la
  // facture réellement créée.
  const lignesValides = lignes.filter((l) => l.description.trim());
  const montantHT = lignesValides.reduce((s, l) => {
    const q = parseFloat(l.quantite) || 0;
    const p = parseFloat(l.prixUnitaire) || 0;
    return s + q * p;
  }, 0);
  const tva = parseFloat(tauxTVA) || 0;
  const montantTVA = Math.round(montantHT * (tva / 100));
  const montantTTC = montantHT + montantTVA;

  function handleClientChange(id: string) {
    const c = clients.find((x) => x.id === id);
    setClientId(id);
    setClientNom(c?.nom ?? "");
  }

  function handleDossierChange(id: string) {
    setDossierId(id);
    if (id) {
      const d = dossiers.find((x) => x.id === id);
      if (d) {
        handleClientChange(d.clientId);
        const coutLabels = resolveDossierCoutLabels(annexes.find((a) => a.id === d.annexeId)?.code);
        setLignes([
          { description: `Frais de prestation — ${d.reference} (${d.nature})`, quantite: "1", prixUnitaire: String(d.fraisPrestation) },
          { description: coutLabels.droitDouane, quantite: "1", prixUnitaire: String(d.droitDouane) },
          { description: coutLabels.fraisCircuit, quantite: "1", prixUnitaire: String(d.fraisCircuit) },
        ]);
        // Droits de douane et frais de circuit sont des débours refacturés au
        // client, pas des prestations de service — la TVA ne s'applique pas
        // dessus. On désactive la TVA par défaut ; l'utilisateur peut la
        // réactiver s'il ne facture que la prestation.
        setTvaOn(false);
      }
    }
  }

  function addLigne() {
    setLignes((l) => [...l, { ...EMPTY_LIGNE }]);
  }

  function removeLigne(i: number) {
    setLignes((l) => l.filter((_, idx) => idx !== i));
  }

  function updateLigne(i: number, field: keyof LigneForm, value: string) {
    setLignes((l) => l.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!clientId || !resolvedAnnexeId || lignes.every((l) => !l.description)) return;
    setSaving(true);
    try {
      const f = await addFacture({
        dossierId: dossierId || null,
        clientId,
        clientNom,
        societeId: societeId || null,
        annexeId: resolvedAnnexeId,
        date,
        dateEcheance,
        lignes: lignesValides.map((l) => ({
          description: l.description,
          quantite: parseFloat(l.quantite) || 1,
          prixUnitaire: parseFloat(l.prixUnitaire) || 0,
        })),
        tauxTVA: parseFloat(tauxTVA) || 0,
        notes,
      });
      onClose();
      go("facture-detail", { id: f.id });
    } catch (err) {
      toastError(toast, err, { title: "Impossible de créer la facture", fallback: "Impossible de créer la facture" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
          <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-foreground">Nouvelle facture</h2>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border/40">
          {/* Section 1 : client + dossier */}
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Dossier lié (optionnel)</Label>
              <Select value={dossierId || "none"} onValueChange={(v) => handleDossierChange(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Aucun dossier —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun dossier —</SelectItem>
                  {dossiers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.reference} · {d.clientNom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Client *</Label>
              <Select
                value={clientId || "none"}
                onValueChange={(v) => handleClientChange(v === "none" ? "" : v)}
                disabled={!!dossierId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sélectionner un client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dossierId && (
                <p className="text-[11px] text-muted-foreground">
                  Verrouillé sur le client du dossier lié.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Société (optionnel)</Label>
              <Select value={societeId || "none"} onValueChange={(v) => setSocieteId(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Aucune (transit) —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucune (transit) —</SelectItem>
                  {societes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showAnnexe && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Annexe *</Label>
                <Select value={annexeId} onValueChange={setAnnexeId}>
                  <SelectTrigger className="w-full">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Date de facture *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Date d&apos;échéance *</Label>
              <Input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} required className="h-9 text-sm" />
            </div>
          </div>

          {/* Section 2 : lignes */}
          <div className="px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lignes de facturation</span>
              <button
                type="button"
                onClick={addLigne}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-950/40"
              >
                <Plus className="size-3" /> Ajouter
              </button>
            </div>

            {/* En-têtes colonnes */}
            <div className="mb-1.5 hidden grid-cols-[1fr_60px_100px_24px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Description</span>
              <span className="text-center">Qté</span>
              <span className="text-right">Prix unitaire</span>
              <span />
            </div>

            <div className="space-y-2">
              {lignes.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_40px_56px_20px] items-center gap-1.5 sm:grid-cols-[1fr_60px_100px_24px] sm:gap-2">
                  <Input
                    value={l.description}
                    onChange={(e) => updateLigne(i, "description", e.target.value)}
                    placeholder="ex. Frais de dédouanement"
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={l.quantite}
                    onChange={(e) => updateLigne(i, "quantite", e.target.value)}
                    className="h-8 text-center text-xs"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={l.prixUnitaire}
                    onChange={(e) => updateLigne(i, "prixUnitaire", e.target.value)}
                    placeholder={UI.placeholders.amountFCFA}
                    className="h-8 text-right text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeLigne(i)}
                    disabled={lignes.length === 1}
                    className="flex size-6 items-center justify-center rounded text-slate-300 text-muted-foreground hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500 disabled:pointer-events-none"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 : TVA + totaux + notes */}
          <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                <Label htmlFor="tva-switch" className="text-xs font-medium text-muted-foreground">
                  Appliquer la TVA ({DEFAULT_TVA_RATE} %)
                </Label>
                <Switch id="tva-switch" checked={tvaOn} onCheckedChange={setTvaOn} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Conditions de paiement, références…"
                  className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-foreground/90 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-border/60 bg-muted/60 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total HT</span>
                  <span className="tabular-nums">{formatFCFA(montantHT)}</span>
                </div>
                {shouldShowTva(tva) && (
                  <div className="mt-1.5 flex justify-between text-muted-foreground">
                    <span>TVA {tva}%</span>
                    <span className="tabular-nums">{formatFCFA(montantTVA)}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between border-t border-border/60 pt-3 font-semibold text-foreground">
                  <span>Total TTC</span>
                  <span className="text-base tabular-nums text-blue-700 dark:text-blue-300">{formatFCFA(montantTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={!clientId || saving}>
              <Receipt className="mr-1.5 size-3.5" /> Créer la facture
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
