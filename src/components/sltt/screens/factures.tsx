"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";

import * as React from "react";
import {
  Plus, Search, Receipt, TrendingUp, Clock, CheckCircle2,
  Trash2, Eye, Send, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/sltt/page-header";
import { EmptyState } from "@/components/sltt/empty-state";
import { KpiCard } from "@/components/sltt/kpi-card";
import { InfoCallout } from "@/components/sltt/info-callout";
import { useStore, type Facture, type FactureStatut, type FactureInput } from "@/lib/store";
import { DEFAULT_TVA_RATE } from "@/lib/domain-types";
import { useNav } from "@/lib/nav-store";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { getErrorMessage } from "@/lib/utils";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { matchesQuery } from "@/lib/search-filter";
import { shouldShowTva } from "@/lib/export";
import { filterBySociete } from "@/lib/filter-by-societe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { resolveDossierCoutLabels } from "@/lib/societe-brand";
import { FactureStatutBadge } from "@/components/sltt/status-badge";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { SocieteFilterSelect, SocieteBadge } from "@/components/sltt/societe-filter-select";
import { TablePagination } from "@/components/sltt/table-pagination";
import { FACTURE_ECHEANCE_JOURS, MS_PER_DAY } from "@/lib/constants";

const PAGE_SIZE = 8;

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
  const tauxTVA = tvaOn ? String(DEFAULT_TVA_RATE) : "0";
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
    if (!clientId || !annexeId || lignes.every((l) => !l.description)) return;
    try {
      const f = await addFacture({
        dossierId: dossierId || null,
        clientId,
        clientNom,
        societeId: societeId || null,
        annexeId,
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
    } catch (err) {
      toast({
        title: "Erreur",
        description: getErrorMessage(err, "Impossible de créer la facture"),
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
          <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Nouvelle facture</h2>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border/40">
          {/* Section 1 : client + dossier */}
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Dossier lié (optionnel)</Label>
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
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Client *</Label>
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
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Verrouillé sur le client du dossier lié.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Société (optionnel)</Label>
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

            {annexes.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Annexe *</Label>
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
            <div className="mb-1.5 hidden grid-cols-[1fr_60px_100px_24px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:grid">
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
          <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                <Label htmlFor="tva-switch" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Appliquer la TVA ({DEFAULT_TVA_RATE} %)
                </Label>
                <Switch id="tva-switch" checked={tvaOn} onCheckedChange={setTvaOn} />
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
                {shouldShowTva(tva) && (
                  <div className="mt-1.5 flex justify-between text-slate-600 dark:text-slate-300">
                    <span>TVA {tva}%</span>
                    <span className="tabular-nums">{formatFCFA(montantTVA)}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between border-t border-border/60 pt-3 font-semibold text-slate-900 dark:text-slate-100">
                  <span>Total TTC</span>
                  <span className="text-base tabular-nums text-blue-700 dark:text-blue-300">{formatFCFA(montantTTC)}</span>
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
  const annexes             = useStore((s) => s.annexes);
  const removeFacture       = useStore((s) => s.removeFacture);
  const updateFactureStatut = useStore((s) => s.updateFactureStatut);
  const go                  = useNav((s) => s.go);
  const { toast }           = useToast();
  const selectedId          = useNav((s) => s.selectedId);
  const pendingFacturePrefill    = useNav((s) => s.pendingFacturePrefill);
  const setPendingFacturePrefill = useNav((s) => s.setPendingFacturePrefill);
  const selectedSocieteId   = useUiPrefs((s) => s.selectedSocieteId);
  const { selectedAnnexeId } = useActiveAnnexe();

  const [search,     setSearch]     = React.useState("");
  const [activeTab,  setActiveTab]  = React.useState<FactureStatut | "Tous">("Tous");
  const [showForm,   setShowForm]   = React.useState(false);
  const [prefillDossierId, setPrefillDossierId] = React.useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Facture | null>(null);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    if (selectedId?.startsWith("D-")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le routeur (nav-store) : ouvre le formulaire puis consomme le marqueur "D-…" de l'URL
      setPrefillDossierId(selectedId);
      setShowForm(true);
      go("factures");
    }
  }, [selectedId, go]);

  // F6 — pont "Facturer" depuis une prestation optionnelle réalisée
  React.useEffect(() => {
    if (!pendingFacturePrefill) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le pont nav-store "Facturer" déclenché depuis un autre écran
    setPrefillDossierId(undefined);
    setShowForm(true);
  }, [pendingFacturePrefill]);

  // F1 — Une facture peut être rattachée à une société (entreposage) ou rester
  // au niveau transit global (societeId null) ; le filtre société partagé
  // scope KPIs et table, comme sur Bons de sortie.
  const societeFactures = React.useMemo(
    () => filterByAnnexe(filterBySociete(factures, selectedSocieteId), selectedAnnexeId),
    [factures, selectedSocieteId, selectedAnnexeId],
  );

  const filtered = React.useMemo(() => {
    return societeFactures.filter((f) => {
      const matchTab = activeTab === "Tous" || f.statut === activeTab;
      return matchTab && matchesQuery(f, ["numero", "clientNom"], search);
    });
  }, [societeFactures, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  // KPIs
  const kpi = React.useMemo(() => {
    const actives  = societeFactures.filter((f) => f.statut !== "Annulée");
    const totalTTC = actives.reduce((s, f) => s + f.montantTTC, 0);
    const totalPaye = actives.reduce((s, f) => s + f.montantPaye, 0);
    const nonSoldees = actives.filter((f) => f.statut !== "Soldée").length;
    const tauxRecouvrement = totalTTC > 0 ? Math.round((totalPaye / totalTTC) * 100) : 0;
    return { total: actives.length, totalTTC, totalPaye, nonSoldees, tauxRecouvrement };
  }, [societeFactures]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeFacture(deleteTarget.id);
      toast({ title: "Facture supprimée", description: deleteTarget.numero });
    } catch (err) {
      toast({
        title: "Erreur",
        description: getErrorMessage(err, "Impossible de supprimer la facture"),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-5">
      <FactureFormModal
        key={prefillDossierId ?? (pendingFacturePrefill ? "prestation-prefill" : "blank")}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setPrefillDossierId(undefined);
          setPendingFacturePrefill(null);
        }}
        prefill={
          prefillDossierId
            ? (() => {
                const d = dossiers.find((x) => x.id === prefillDossierId);
                if (!d) return {};
                return {
                  dossierId: d.id,
                  clientId: d.clientId,
                  clientNom: d.clientNom,
                  // Droits de douane et frais de circuit sont des débours
                  // refacturés, pas des prestations — pas de TVA par défaut.
                  tauxTVA: 0,
                  lignes: (() => {
                    const coutLabels = resolveDossierCoutLabels(annexes.find((a) => a.id === d.annexeId)?.code);
                    return [
                      { description: `Frais de prestation — ${d.reference} (${d.nature})`, quantite: 1, prixUnitaire: d.fraisPrestation, montantHT: d.fraisPrestation },
                      { description: coutLabels.droitDouane, quantite: 1, prixUnitaire: d.droitDouane, montantHT: d.droitDouane },
                      { description: coutLabels.fraisCircuit, quantite: 1, prixUnitaire: d.fraisCircuit, montantHT: d.fraisCircuit },
                    ];
                  })(),
                };
              })()
            : pendingFacturePrefill
              ? {
                  clientId: pendingFacturePrefill.clientId,
                  clientNom: pendingFacturePrefill.clientNom,
                  societeId: pendingFacturePrefill.societeId,
                  lignes: [
                    {
                      description: pendingFacturePrefill.description,
                      quantite: 1,
                      prixUnitaire: pendingFacturePrefill.montant,
                    },
                  ],
                }
              : undefined
        }
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
        <Button variant="link" className="h-auto p-0 font-semibold" onClick={() => go("comptabilite")}>
          le module Comptabilité
        </Button>
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
              className="h-full rounded-full bg-emerald-500 transition-[width]"
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
              ? societeFactures.length
              : societeFactures.filter((f) => f.statut === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <SocieteFilterSelect className="h-8 w-full sm:w-44" />
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Receipt className="size-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Liste des factures</h2>
          <span className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={factures.length === 0 ? "Aucune facture créée" : "Aucun résultat"}
            action={
              factures.length === 0 && canWrite ? (
                <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="mr-1.5 size-3.5" /> Créer la première facture
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((f) => (
                <FactureMobileCard
                  key={f.id}
                  facture={f}
                  canWrite={canWrite}
                  onView={() => go("facture-detail", { id: f.id })}
                  onMarkEnvoyee={() => updateFactureStatut(f.id, "Envoyée")}
                  onDelete={() => setDeleteTarget(f)}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table aria-label="Liste des factures">
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      N° Facture
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Client
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Société
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Échéance
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Montant TTC
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Payé
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Statut
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((f) => (
                    <FactureTableRow
                      key={f.id}
                      facture={f}
                      canWrite={canWrite}
                      onView={() => go("facture-detail", { id: f.id })}
                      onMarkEnvoyee={() => updateFactureStatut(f.id, "Envoyée")}
                      onDelete={() => setDeleteTarget(f)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`facture${filtered.length !== 1 ? "s" : ""}`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Supprimer cette facture ?"
        description={<>La facture <strong>{deleteTarget?.numero}</strong> sera définitivement supprimée. Cette action est irréversible.</>}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LISTE — carte mobile / ligne de table                              */
/* ------------------------------------------------------------------ */

function isFactureEchue(f: Facture): boolean {
  return (
    f.statut !== "Soldée" &&
    f.statut !== "Annulée" &&
    f.dateEcheance < new Date().toISOString().slice(0, 10)
  );
}

interface FactureRowProps {
  facture: Facture;
  canWrite: boolean;
  onView: () => void;
  onMarkEnvoyee: () => void;
  onDelete: () => void;
}

function FactureMobileCard({ facture: f, canWrite, onView, onMarkEnvoyee, onDelete }: FactureRowProps) {
  const isEchue = isFactureEchue(f);

  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button
            onClick={onView}
            className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
          >
            {f.numero}
          </button>
          <p className="mt-0.5 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{f.clientNom}</p>
        </div>
        <FactureStatutBadge statut={f.statut} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Société</dt>
          <dd><SocieteBadge societeNom={f.societeNom} size="sm" /></dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Date</dt>
          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(f.date)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Échéance</dt>
          <dd className={`tabular-nums ${isEchue ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
            {formatDateShort(f.dateEcheance)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Montant TTC</dt>
          <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatFCFA(f.montantTTC)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Payé</dt>
          <dd className="tabular-nums text-emerald-700 dark:text-emerald-300">{formatFCFA(f.montantPaye)}</dd>
        </div>
      </dl>
      <div
        className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Voir / Imprimer"
          onClick={onView}
          className="rounded p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <Eye className="size-4" />
        </button>
        {canWrite && f.statut === "Brouillon" && (
          <button
            title="Marquer comme envoyée"
            onClick={onMarkEnvoyee}
            className="rounded p-1.5 text-slate-400 dark:text-slate-500 hover:bg-blue-50 dark:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Send className="size-4" />
          </button>
        )}
        {canWrite && (
          <button
            title="Supprimer"
            onClick={onDelete}
            className="rounded p-1.5 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

function FactureTableRow({ facture: f, canWrite, onView, onMarkEnvoyee, onDelete }: FactureRowProps) {
  const isEchue = isFactureEchue(f);

  return (
    <TableRow className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
      <TableCell className="px-4 py-3.5">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
        >
          {f.numero}
        </button>
      </TableCell>
      <TableCell className="max-w-[180px] px-4 py-3.5">
        <p className="truncate text-xs text-slate-700 dark:text-slate-300">{f.clientNom}</p>
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <SocieteBadge societeNom={f.societeNom} size="sm" />
      </TableCell>
      <TableCell className="px-4 py-3.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
        {formatDateShort(f.date)}
      </TableCell>
      <TableCell className={`px-4 py-3.5 text-xs tabular-nums ${isEchue ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
        {formatDateShort(f.dateEcheance)}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {formatFCFA(f.montantTTC)}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right text-xs tabular-nums text-emerald-700 dark:text-emerald-300">
        {formatFCFA(f.montantPaye)}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <FactureStatutBadge statut={f.statut} />
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            title="Voir / Imprimer"
            onClick={onView}
            className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Eye className="size-3.5" />
          </button>
          {canWrite && f.statut === "Brouillon" && (
            <button
              title="Marquer comme envoyée"
              onClick={onMarkEnvoyee}
              className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-blue-50 dark:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Send className="size-3.5" />
            </button>
          )}
          {canWrite && (
            <button
              title="Supprimer"
              onClick={onDelete}
              className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
