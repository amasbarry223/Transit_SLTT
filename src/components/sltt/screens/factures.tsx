"use client";

import * as React from "react";
import {
  Plus, Search, Receipt, TrendingUp, Clock, CheckCircle2,
  ArrowRight, Trash2, Eye, Send, X, ChevronDown, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { InfoCallout } from "@/components/sltt/info-callout";
import { useStore, type Facture, type FactureStatut, type FactureInput } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { FactureStatutBadge } from "@/components/sltt/status-badge";

/* ------------------------------------------------------------------ */
/* FORM — nouvelle facture                                             */
/* ------------------------------------------------------------------ */

interface LigneForm { description: string; quantite: string; prixUnitaire: string; }

const EMPTY_LIGNE: LigneForm = { description: "", quantite: "1", prixUnitaire: "" };

function FactureFormModal({
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
  const addFacture = useStore((s) => s.addFacture);
  const go         = useNav((s) => s.go);
  const { toast }  = useToast();

  const today    = new Date().toISOString().slice(0, 10);
  const in30days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [clientId,     setClientId]     = React.useState(prefill?.clientId ?? "");
  const [clientNom,    setClientNom]    = React.useState(prefill?.clientNom ?? "");
  const [dossierId,    setDossierId]    = React.useState(prefill?.dossierId ?? "");
  const [date,         setDate]         = React.useState(prefill?.date ?? today);
  const [dateEcheance, setDateEcheance] = React.useState(prefill?.dateEcheance ?? in30days);
  const [tauxTVA,      setTauxTVA]      = React.useState(String(prefill?.tauxTVA ?? 18));
  const [notes,        setNotes]        = React.useState(prefill?.notes ?? "");
  const [lignes,       setLignes]       = React.useState<LigneForm[]>(
    prefill?.lignes?.map((l) => ({
      description: l.description,
      quantite: String(l.quantite),
      prixUnitaire: String(l.prixUnitaire),
    })) ?? [{ ...EMPTY_LIGNE }]
  );

  const montantHT = lignes.reduce((s, l) => {
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
        setLignes([
          { description: `Frais de prestation — ${d.reference} (${d.nature})`, quantite: "1", prixUnitaire: String(d.fraisPrestation) },
          { description: `Droits de douane`, quantite: "1", prixUnitaire: String(d.droitDouane) },
          { description: `Frais de circuit`, quantite: "1", prixUnitaire: String(d.fraisCircuit) },
        ]);
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
    if (!clientId || lignes.every((l) => !l.description)) return;
    try {
      const f = await addFacture({
        dossierId: dossierId || null,
        clientId,
        clientNom,
        date,
        dateEcheance,
        lignes: lignes
          .filter((l) => l.description.trim())
          .map((l) => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 1,
            prixUnitaire: parseFloat(l.prixUnitaire) || 0,
          })),
        tauxTVA: parseFloat(tauxTVA) || 0,
        notes,
      });
      onClose();
      go("facture-detail", { id: f.id });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer la facture",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
          <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Nouvelle facture</h2>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border/40">
          {/* Section 1 : client + dossier */}
          <div className="grid grid-cols-2 gap-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Dossier lié (optionnel)</Label>
              <div className="relative">
                <select
                  value={dossierId}
                  onChange={(e) => handleDossierChange(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">— Aucun dossier —</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.reference} · {d.clientNom}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Client *</Label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                  className="w-full appearance-none rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Date de facture *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Date d&apos;échéance *</Label>
              <Input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} required className="h-9 text-sm" />
            </div>
          </div>

          {/* Section 2 : lignes */}
          <div className="px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lignes de facturation</span>
              <button
                type="button"
                onClick={addLigne}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-950/40"
              >
                <Plus className="size-3" /> Ajouter
              </button>
            </div>

            {/* En-têtes colonnes */}
            <div className="mb-1.5 grid grid-cols-[1fr_60px_100px_24px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <span>Description</span>
              <span className="text-center">Qté</span>
              <span className="text-right">Prix unitaire</span>
              <span />
            </div>

            <div className="space-y-2">
              {lignes.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_100px_24px] items-center gap-2">
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
                    placeholder="0"
                    className="h-8 text-right text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeLigne(i)}
                    disabled={lignes.length === 1}
                    className="flex size-6 items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500 disabled:pointer-events-none"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 : TVA + totaux + notes */}
          <div className="grid grid-cols-2 gap-6 px-6 py-5">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Taux TVA (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={tauxTVA}
                  onChange={(e) => setTauxTVA(e.target.value)}
                  className="h-9 w-28 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Conditions de paiement, références…"
                  className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-border/60 bg-slate-50/60 dark:bg-slate-800/60 p-4 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Sous-total HT</span>
                  <span className="tabular-nums">{formatFCFA(montantHT)}</span>
                </div>
                <div className="mt-1.5 flex justify-between text-slate-600 dark:text-slate-300">
                  <span>TVA {tva}%</span>
                  <span className="tabular-nums">{formatFCFA(montantTVA)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-border/60 pt-3 font-semibold text-slate-900 dark:text-slate-100">
                  <span>Total TTC</span>
                  <span className="text-base tabular-nums text-blue-700">{formatFCFA(montantTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={!clientId}>
              <Receipt className="mr-1.5 size-3.5" /> Créer la facture
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* SCREEN                                                              */
/* ------------------------------------------------------------------ */

const TABS: Array<{ key: FactureStatut | "Tous"; label: string }> = [
  { key: "Tous",      label: "Toutes" },
  { key: "Brouillon", label: "Brouillon" },
  { key: "Envoyée",   label: "Envoyées" },
  { key: "Partielle", label: "Partielles" },
  { key: "Soldée",    label: "Soldées" },
  { key: "Annulée",   label: "Annulées" },
];

export function FacturesScreen() {
  const canWrite = usePermission("factures:write");
  const factures            = useStore((s) => s.factures);
  const dossiers            = useStore((s) => s.dossiers);
  const removeFacture       = useStore((s) => s.removeFacture);
  const updateFactureStatut = useStore((s) => s.updateFactureStatut);
  const go                  = useNav((s) => s.go);
  const { toast }           = useToast();
  const selectedId          = useNav((s) => s.selectedId);

  const [search,     setSearch]     = React.useState("");
  const [activeTab,  setActiveTab]  = React.useState<FactureStatut | "Tous">("Tous");
  const [showForm,   setShowForm]   = React.useState(false);
  const [prefillDossierId, setPrefillDossierId] = React.useState<string | undefined>();

  const [prevSelectedId, setPrevSelectedId] = React.useState(selectedId);
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId);
    if (selectedId?.startsWith("D-")) {
      setPrefillDossierId(selectedId);
      setShowForm(true);
    }
  }

  React.useEffect(() => {
    if (selectedId?.startsWith("D-")) go("factures");
  }, [selectedId, go]);

  const filtered = React.useMemo(() => {
    return factures.filter((f) => {
      const matchTab    = activeTab === "Tous" || f.statut === activeTab;
      const matchSearch = !search ||
        f.numero.toLowerCase().includes(search.toLowerCase()) ||
        f.clientNom.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [factures, activeTab, search]);

  // KPIs
  const kpi = React.useMemo(() => {
    const actives  = factures.filter((f) => f.statut !== "Annulée");
    const totalTTC = actives.reduce((s, f) => s + f.montantTTC, 0);
    const totalPaye = actives.reduce((s, f) => s + f.montantPaye, 0);
    const nonSoldees = actives.filter((f) => f.statut !== "Soldée").length;
    const tauxRecouvrement = totalTTC > 0 ? Math.round((totalPaye / totalTTC) * 100) : 0;
    return { total: actives.length, totalTTC, totalPaye, nonSoldees, tauxRecouvrement };
  }, [factures]);

  async function handleDelete(f: Facture) {
    if (confirm(`Supprimer la facture ${f.numero} ?`)) {
      try {
        await removeFacture(f.id);
        toast({ title: "Facture supprimée", description: f.numero });
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err.message || "Impossible de supprimer la facture",
          variant: "destructive",
        });
      }
    }
  }

  return (
    <div className="space-y-5">
      <FactureFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setPrefillDossierId(undefined); }}
        prefill={prefillDossierId ? (() => {
          const d = dossiers.find((x) => x.id === prefillDossierId);
          if (!d) return {};
          return {
            dossierId: d.id,
            clientId: d.clientId,
            clientNom: d.clientNom,
            lignes: [
              { description: `Frais de prestation — ${d.reference} (${d.nature})`, quantite: 1, prixUnitaire: d.fraisPrestation, montantHT: d.fraisPrestation },
              { description: `Droits de douane`, quantite: 1, prixUnitaire: d.droitDouane, montantHT: d.droitDouane },
              { description: `Frais de circuit`, quantite: 1, prixUnitaire: d.fraisCircuit, montantHT: d.fraisCircuit },
            ],
          };
        })() : undefined}
      />

      <PageHeader title="Factures" description="Gestion et suivi de la facturation client">
        {canWrite && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 size-3.5" /> Nouvelle facture
          </Button>
        )}
      </PageHeader>

      <InfoCallout>
        Ce module émet des documents facturables au client (avec TVA). Pour un suivi interne de
        paiement sans facture, utilisez{" "}
        <button onClick={() => go("comptabilite")} className="font-semibold underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-100">
          le module Comptabilité
        </button>
        . Les deux totaux sont indépendants et ne se recoupent pas automatiquement.
      </InfoCallout>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard compact label="Factures actives" value={String(kpi.total)} icon={Receipt} tone="blue" />
        <KpiCard compact label="Montant total TTC" value={formatFCFA(kpi.totalTTC)} icon={TrendingUp} tone="emerald" />
        <KpiCard compact label="Recouvré" value={formatFCFA(kpi.totalPaye)} icon={CheckCircle2} tone="violet" />
        <KpiCard compact label="Non soldées" value={String(kpi.nonSoldees)} icon={Clock} tone="amber" />
      </div>

      {/* Taux de recouvrement bar */}
      {kpi.total > 0 && (
        <div className="rounded-xl border border-border/80 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Taux de recouvrement</span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{kpi.tauxRecouvrement}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${kpi.tauxRecouvrement}%` }}
            />
          </div>
        </div>
      )}

      {/* Filtres + recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const count = tab.key === "Tous"
              ? factures.length
              : factures.filter((f) => f.statut === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-white dark:bg-slate-900 shadow-sm">
        {/* Labels */}
        <div className="grid grid-cols-[1.4fr_1.6fr_80px_90px_110px_110px_100px_auto] gap-x-3 border-b border-border/50 bg-slate-50/70 px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          <span>N° Facture</span>
          <span>Client</span>
          <span>Date</span>
          <span>Échéance</span>
          <span className="text-right">Montant TTC</span>
          <span className="text-right">Payé</span>
          <span>Statut</span>
          <span />
        </div>

        <div className="divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="size-10 text-slate-200 dark:text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                {factures.length === 0 ? "Aucune facture créée" : "Aucun résultat"}
              </p>
              {factures.length === 0 && canWrite && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
                  <Plus className="mr-1.5 size-3.5" /> Créer la première facture
                </Button>
              )}
            </div>
          ) : (
            filtered.map((f) => {
              const isEchue = f.statut !== "Soldée" && f.statut !== "Annulée" && f.dateEcheance < new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={f.id}
                  className="grid grid-cols-[1.4fr_1.6fr_80px_90px_110px_110px_100px_auto] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                >
                  <button
                    onClick={() => go("facture-detail", { id: f.id })}
                    className="flex items-center gap-1.5 font-mono text-[12px] font-semibold text-blue-700 hover:underline"
                  >
                    {f.numero}
                  </button>
                  <p className="truncate text-xs text-slate-700 dark:text-slate-300">{f.clientNom}</p>
                  <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDateShort(f.date)}</p>
                  <p className={`text-xs tabular-nums ${isEchue ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {formatDateShort(f.dateEcheance)}
                  </p>
                  <p className="text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatFCFA(f.montantTTC)}</p>
                  <p className="text-right text-xs tabular-nums text-emerald-700">{formatFCFA(f.montantPaye)}</p>
                  <FactureStatutBadge statut={f.statut} />
                  <div className="flex items-center gap-1">
                    <button
                      title="Voir / Imprimer"
                      onClick={() => go("facture-detail", { id: f.id })}
                      className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    {f.statut === "Brouillon" && (
                      <button
                        title="Marquer comme envoyée"
                        onClick={() => updateFactureStatut(f.id, "Envoyée")}
                        className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-blue-50 dark:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Send className="size-3.5" />
                      </button>
                    )}
                    <button
                      title="Supprimer"
                      onClick={() => handleDelete(f)}
                      className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
