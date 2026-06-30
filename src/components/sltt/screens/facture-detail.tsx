"use client";

import * as React from "react";
import {
  ArrowLeft, Printer, Send, CheckCircle2, XCircle,
  CreditCard, Edit2, Save, X, Plus, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/sltt/page-header";
import {
  useStore,
  type Facture,
  type FactureStatut,
  type FactureInput,
} from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatFCFA, formatDateShort } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* STATUT badge                                                        */
/* ------------------------------------------------------------------ */

const STATUT_STYLES: Record<FactureStatut, string> = {
  Brouillon: "bg-slate-100 text-slate-600 border-slate-200",
  Envoyée:   "bg-blue-50 text-blue-700 border-blue-200",
  Partielle: "bg-amber-50 text-amber-700 border-amber-200",
  Soldée:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Annulée:   "bg-red-50 text-red-500 border-red-200",
};

/* ------------------------------------------------------------------ */
/* ENREGISTRER UN PAIEMENT                                             */
/* ------------------------------------------------------------------ */

function PaiementModal({
  facture,
  onClose,
}: {
  facture: Facture;
  onClose: () => void;
}) {
  const recordPaiement = useStore((s) => s.recordFacturePaiement);
  const reste = facture.montantTTC - facture.montantPaye;
  const [montant, setMontant] = React.useState(String(reste));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!m || m <= 0) return;
    recordPaiement(facture.id, m);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Enregistrer un paiement</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Montant TTC</span>
              <span className="tabular-nums font-medium">{formatFCFA(facture.montantTTC)}</span>
            </div>
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Déjà payé</span>
              <span className="tabular-nums font-medium text-emerald-700">{formatFCFA(facture.montantPaye)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border/50 pt-2 font-semibold text-slate-900">
              <span>Reste à payer</span>
              <span className="tabular-nums text-amber-700">{formatFCFA(reste)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Montant reçu (FCFA) *</Label>
            <Input
              type="number"
              min="1"
              max={reste}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              autoFocus
              className="h-10 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit">
              <CheckCircle2 className="mr-1.5 size-3.5" /> Valider le paiement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VUE IMPRIMABLE                                                      */
/* ------------------------------------------------------------------ */

function PrintView({ facture }: { facture: Facture }) {
  const dossiers = useStore((s) => s.dossiers);
  const dossier  = facture.dossierId ? dossiers.find((d) => d.id === facture.dossierId) : null;

  return (
    <div id="sltt-print-zone" className="hidden print:block bg-white p-12 text-slate-900" style={{ fontFamily: "Georgia, serif" }}>
      {/* En-tête */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Arial, sans-serif" }}>SLTT</h1>
          <p className="text-xs text-slate-500 mt-0.5">Société Traoré de Logistique, Transit et Transport</p>
          <p className="text-xs text-slate-500">Bamako, Mali · contact@sltt.ml</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-800" style={{ fontFamily: "Arial, sans-serif" }}>FACTURE</p>
          <p className="text-base font-semibold mt-1">{facture.numero}</p>
          <p className="text-xs text-slate-500 mt-0.5">Date : {formatDateShort(facture.date)}</p>
          <p className="text-xs text-slate-500">Échéance : {formatDateShort(facture.dateEcheance)}</p>
        </div>
      </div>

      {/* Client */}
      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mb-1">Facturé à</p>
        <p className="font-bold text-base">{facture.clientNom}</p>
        {dossier && (
          <p className="text-xs text-slate-500 mt-0.5">Dossier lié : {dossier.reference} · BL {dossier.bl}</p>
        )}
      </div>

      {/* Tableau des lignes */}
      <table className="w-full text-sm mb-6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#1E40AF", color: "white" }}>
            <th className="text-left px-3 py-2 text-xs font-semibold">Description</th>
            <th className="text-center px-3 py-2 text-xs font-semibold w-16">Qté</th>
            <th className="text-right px-3 py-2 text-xs font-semibold w-32">P.U. HT</th>
            <th className="text-right px-3 py-2 text-xs font-semibold w-36">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {facture.lignes.map((l, i) => (
            <tr key={l.id} style={{ background: i % 2 === 0 ? "white" : "#F8FAFC" }}>
              <td className="px-3 py-2 border-b border-slate-100">{l.description}</td>
              <td className="px-3 py-2 border-b border-slate-100 text-center tabular-nums">{l.quantite}</td>
              <td className="px-3 py-2 border-b border-slate-100 text-right tabular-nums">{formatFCFA(l.prixUnitaire)}</td>
              <td className="px-3 py-2 border-b border-slate-100 text-right tabular-nums font-medium">{formatFCFA(l.montantHT)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totaux */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="flex justify-between py-1.5 text-sm text-slate-600">
            <span>Sous-total HT</span>
            <span className="tabular-nums font-medium">{formatFCFA(facture.montantHT)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm text-slate-600">
            <span>TVA {facture.tauxTVA}%</span>
            <span className="tabular-nums font-medium">{formatFCFA(facture.montantTVA)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-slate-900 mt-1 font-bold text-base">
            <span>TOTAL TTC</span>
            <span className="tabular-nums text-blue-800">{formatFCFA(facture.montantTTC)}</span>
          </div>
          {facture.montantPaye > 0 && (
            <>
              <div className="flex justify-between py-1.5 text-sm text-emerald-700">
                <span>Déjà payé</span>
                <span className="tabular-nums">- {formatFCFA(facture.montantPaye)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-semibold text-amber-700">
                <span>Reste à payer</span>
                <span className="tabular-nums">{formatFCFA(facture.montantTTC - facture.montantPaye)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {facture.notes && (
        <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">Notes</p>
          <p>{facture.notes}</p>
        </div>
      )}

      {/* Pied */}
      <div className="mt-12 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
        <p>Facture générée par le système SLTT · {facture.creePar} · {formatDateShort(facture.creeLe)}</p>
        <p className="mt-0.5">Merci de votre confiance. Paiement par virement ou espèces.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SCREEN                                                              */
/* ------------------------------------------------------------------ */

export function FactureDetailScreen() {
  const selectedId         = useNav((s) => s.selectedId);
  const go                 = useNav((s) => s.go);
  const factures           = useStore((s) => s.factures);
  const updateFactureStatut = useStore((s) => s.updateFactureStatut);
  const updateFacture      = useStore((s) => s.updateFacture);
  const clients            = useStore((s) => s.clients);
  const dossiers           = useStore((s) => s.dossiers);

  const facture = factures.find((f) => f.id === selectedId);

  const [showPaiement, setShowPaiement] = React.useState(false);
  const [editMode,     setEditMode]     = React.useState(false);

  // Edition state
  const [editDate,         setEditDate]         = React.useState("");
  const [editDateEcheance, setEditDateEcheance] = React.useState("");
  const [editTauxTVA,      setEditTauxTVA]      = React.useState("");
  const [editNotes,        setEditNotes]         = React.useState("");
  const [editLignes,       setEditLignes]        = React.useState<Array<{ description: string; quantite: string; prixUnitaire: string }>>([]);

  React.useEffect(() => {
    if (facture && editMode) {
      setEditDate(facture.date);
      setEditDateEcheance(facture.dateEcheance);
      setEditTauxTVA(String(facture.tauxTVA));
      setEditNotes(facture.notes);
      setEditLignes(facture.lignes.map((l) => ({
        description: l.description,
        quantite: String(l.quantite),
        prixUnitaire: String(l.prixUnitaire),
      })));
    }
  }, [editMode, facture]);

  if (!facture) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500">Facture introuvable.</p>
        <Button variant="outline" className="mt-4" onClick={() => go("factures")}>
          <ArrowLeft className="mr-1.5 size-3.5" /> Retour
        </Button>
      </div>
    );
  }

  const dossier = facture.dossierId ? dossiers.find((d) => d.id === facture.dossierId) : null;
  const reste   = facture.montantTTC - facture.montantPaye;
  const pctPaye = facture.montantTTC > 0 ? Math.round((facture.montantPaye / facture.montantTTC) * 100) : 0;
  const isEchue = facture.statut !== "Soldée" && facture.statut !== "Annulée" &&
                  facture.dateEcheance < new Date().toISOString().slice(0, 10);

  function handleSaveEdit() {
    if (!facture) return;
    const input: FactureInput = {
      dossierId: facture.dossierId,
      clientId: facture.clientId,
      clientNom: facture.clientNom,
      date: editDate,
      dateEcheance: editDateEcheance,
      tauxTVA: parseFloat(editTauxTVA) || 0,
      notes: editNotes,
      lignes: editLignes
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description,
          quantite: parseFloat(l.quantite) || 1,
          prixUnitaire: parseFloat(l.prixUnitaire) || 0,
        })),
    };
    updateFacture(facture.id, input);
    setEditMode(false);
  }

  const editMontantHT = editLignes.reduce((s, l) => s + (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaire) || 0), 0);
  const editTVA       = parseFloat(editTauxTVA) || 0;
  const editTTC       = editMontantHT + Math.round(editMontantHT * (editTVA / 100));

  return (
    <>
      <PrintView facture={facture} />

      {showPaiement && (
        <PaiementModal facture={facture} onClose={() => setShowPaiement(false)} />
      )}

      <div className="print:hidden space-y-5">
        <PageHeader
          title={facture.numero}
          description={`Client : ${facture.clientNom}${dossier ? ` · Dossier ${dossier.reference}` : ""}`}
        >
          <div className="flex items-center gap-2">
            {/* Statut badge */}
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUT_STYLES[facture.statut]}`}>
              {facture.statut}
            </span>

            {/* Actions contextuelles */}
            {facture.statut === "Brouillon" && (
              <Button size="sm" variant="outline" onClick={() => updateFactureStatut(facture.id, "Envoyée")}>
                <Send className="mr-1.5 size-3.5" /> Marquer envoyée
              </Button>
            )}
            {facture.statut !== "Soldée" && facture.statut !== "Annulée" && (
              <Button size="sm" variant="outline" onClick={() => setShowPaiement(true)}>
                <CreditCard className="mr-1.5 size-3.5" /> Paiement
              </Button>
            )}
            {facture.statut !== "Annulée" && facture.statut !== "Soldée" && (
              <Button size="sm" variant="outline" onClick={() => updateFactureStatut(facture.id, "Annulée")} className="text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="mr-1.5 size-3.5" /> Annuler
              </Button>
            )}
            {editMode ? (
              <>
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="mr-1.5 size-3.5" /> Enregistrer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                  <X className="size-3.5" />
                </Button>
              </>
            ) : (
              facture.statut === "Brouillon" && (
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                  <Edit2 className="mr-1.5 size-3.5" /> Modifier
                </Button>
              )
            )}
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-3.5" /> Imprimer / PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => go("factures")}>
              <ArrowLeft className="mr-1.5 size-3.5" /> Retour
            </Button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* Colonne principale */}
          <div className="space-y-4 lg:col-span-2">

            {/* Infos facture */}
            <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm">
              <div className="border-b border-border/50 bg-slate-50/60 px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Informations</span>
              </div>
              <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
                {[
                  { label: "N° Facture",  value: facture.numero },
                  { label: "Client",      value: facture.clientNom },
                  { label: "Date",        value: editMode ? undefined : formatDateShort(facture.date), edit: editMode ? <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-sm" /> : undefined },
                  { label: "Échéance",    value: editMode ? undefined : formatDateShort(facture.dateEcheance), edit: editMode ? <Input type="date" value={editDateEcheance} onChange={(e) => setEditDateEcheance(e.target.value)} className="h-8 text-sm" /> : undefined, warn: isEchue },
                  { label: "Dossier lié", value: dossier ? dossier.reference : "—" },
                  { label: "TVA",         value: editMode ? undefined : `${facture.tauxTVA}%`, edit: editMode ? <Input type="number" value={editTauxTVA} onChange={(e) => setEditTauxTVA(e.target.value)} className="h-8 w-20 text-sm" /> : undefined },
                  { label: "Créé par",    value: facture.creePar },
                  { label: "Créé le",     value: formatDateShort(facture.creeLe) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                    {item.edit ?? (
                      <p className={`mt-0.5 text-sm font-medium ${item.warn ? "text-red-600" : "text-slate-800"}`}>
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lignes de facturation */}
            <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border/50 bg-slate-50/60 px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lignes de facturation</span>
                {editMode && (
                  <button
                    onClick={() => setEditLignes((l) => [...l, { description: "", quantite: "1", prixUnitaire: "" }])}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    <Plus className="size-3" /> Ajouter
                  </button>
                )}
              </div>

              {/* Header colonnes */}
              <div className="grid grid-cols-[1fr_56px_120px_120px] gap-x-3 border-b border-border/40 bg-slate-50/30 px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Description</span>
                <span className="text-center">Qté</span>
                <span className="text-right">P.U. HT</span>
                <span className="text-right">Total HT</span>
              </div>

              <div className="divide-y divide-border/30">
                {(editMode ? editLignes : facture.lignes).map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_56px_120px_120px] items-center gap-x-3 px-5 py-2.5">
                    {editMode ? (
                      <>
                        <Input
                          value={(l as { description: string }).description}
                          onChange={(e) => setEditLignes((ls) => ls.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))}
                          className="h-7 text-xs"
                        />
                        <Input
                          type="number" min="0.01"
                          value={(l as { quantite: string }).quantite}
                          onChange={(e) => setEditLignes((ls) => ls.map((x, idx) => idx === i ? { ...x, quantite: e.target.value } : x))}
                          className="h-7 text-center text-xs"
                        />
                        <Input
                          type="number" min="0"
                          value={(l as { prixUnitaire: string }).prixUnitaire}
                          onChange={(e) => setEditLignes((ls) => ls.map((x, idx) => idx === i ? { ...x, prixUnitaire: e.target.value } : x))}
                          className="h-7 text-right text-xs"
                        />
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs tabular-nums text-slate-500">
                            {formatFCFA((parseFloat((l as {quantite:string}).quantite)||0)*(parseFloat((l as {prixUnitaire:string}).prixUnitaire)||0))}
                          </span>
                          <button
                            onClick={() => setEditLignes((ls) => ls.filter((_, idx) => idx !== i))}
                            className="ml-1 rounded p-0.5 text-slate-300 hover:text-red-500"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-700">{(l as { description: string }).description}</p>
                        <p className="text-center text-sm tabular-nums text-slate-500">{(l as { quantite: number }).quantite}</p>
                        <p className="text-right text-sm tabular-nums text-slate-600">{formatFCFA((l as { prixUnitaire: number }).prixUnitaire)}</p>
                        <p className="text-right text-sm font-semibold tabular-nums text-slate-900">{formatFCFA((l as { montantHT: number }).montantHT)}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="flex justify-end border-t border-border/50 bg-slate-50/40 px-5 py-4">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total HT</span>
                    <span className="tabular-nums font-medium">{formatFCFA(editMode ? editMontantHT : facture.montantHT)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>TVA {editMode ? editTVA : facture.tauxTVA}%</span>
                    <span className="tabular-nums font-medium">{formatFCFA(editMode ? Math.round(editMontantHT * editTVA / 100) : facture.montantTVA)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-slate-900">
                    <span>Total TTC</span>
                    <span className="tabular-nums text-blue-700 text-base">{formatFCFA(editMode ? editTTC : facture.montantTTC)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(facture.notes || editMode) && (
              <div className="rounded-xl border border-border/80 bg-white p-5 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                {editMode ? (
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                ) : (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{facture.notes}</p>
                )}
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4">

            {/* Suivi paiement */}
            <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm">
              <div className="border-b border-border/50 bg-slate-50/60 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suivi paiement</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Montant TTC</span>
                  <span className="font-semibold tabular-nums">{formatFCFA(facture.montantTTC)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Payé</span>
                  <span className="font-semibold tabular-nums">{formatFCFA(facture.montantPaye)}</span>
                </div>
                {/* Barre de progression */}
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pctPaye}%` }} />
                </div>
                <div className="flex justify-between text-xs text-amber-700">
                  <span>Reste à payer</span>
                  <span className="font-bold tabular-nums">{formatFCFA(reste)}</span>
                </div>

                {isEchue && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                    ⚠ Échéance dépassée depuis le {formatDateShort(facture.dateEcheance)}
                  </div>
                )}

                {facture.statut !== "Soldée" && facture.statut !== "Annulée" && (
                  <Button className="w-full" size="sm" onClick={() => setShowPaiement(true)}>
                    <CreditCard className="mr-1.5 size-3.5" /> Enregistrer un paiement
                  </Button>
                )}
              </div>
            </div>

            {/* Dossier lié */}
            {dossier && (
              <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Dossier lié</p>
                <button
                  onClick={() => go("dossier-detail", { id: dossier.id })}
                  className="flex w-full items-center justify-between rounded-lg border border-border/60 p-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{dossier.reference}</p>
                    <p className="text-[10px] text-slate-500">{dossier.nature} · {dossier.statut}</p>
                  </div>
                  <ChevronDown className="size-3.5 -rotate-90 text-slate-400" />
                </button>
              </div>
            )}

            {/* Actions rapides statut */}
            <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Changer le statut</p>
              <div className="space-y-1.5">
                {(["Brouillon", "Envoyée", "Partielle", "Soldée", "Annulée"] as FactureStatut[]).map((s) => (
                  <button
                    key={s}
                    disabled={facture.statut === s}
                    onClick={() => updateFactureStatut(facture.id, s)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      facture.statut === s
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 disabled:cursor-default"
                    }`}
                  >
                    <span className={`size-1.5 shrink-0 rounded-full ${
                      s === "Soldée" ? "bg-emerald-500" :
                      s === "Envoyée" ? "bg-blue-500" :
                      s === "Partielle" ? "bg-amber-500" :
                      s === "Annulée" ? "bg-red-500" : "bg-slate-400"
                    }`} />
                    {s}
                    {facture.statut === s && <span className="ml-auto text-[10px] text-blue-500">● Actuel</span>}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
