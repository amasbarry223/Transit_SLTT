"use client";

import { useState, Fragment } from "react";
import {
  ArrowLeft, Pencil, X, CheckCircle2, Clock, XCircle, AlertCircle,
  Send, FolderKanban, Trash2, Save, AlertTriangle, User, Package,
  CalendarDays, Printer, FileCheck2, ChevronRight, Banknote,
  MoreHorizontal,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { Devis, DevisInput, DevisStatut } from "@/lib/store";
import { formatFCFA, formatDateShort, parseAmount } from "@/lib/format";
import { printDevis } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Statut config                                                        */
/* ------------------------------------------------------------------ */

type StatutCfg = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  dot: string;
  text: string;
  desc: string;
};

const STATUT_CONFIG: Record<DevisStatut, StatutCfg> = {
  Brouillon: {
    label: "Brouillon",  icon: Clock,
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",   text: "text-slate-700",
    desc: "Ce devis est en cours de rédaction.",
  },
  Envoyé: {
    label: "Envoyé",    icon: Send,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",    text: "text-blue-700",
    desc: "En attente du retour du client.",
  },
  Accepté: {
    label: "Accepté",   icon: CheckCircle2,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500", text: "text-emerald-700",
    desc: "Le client a accepté l'estimation.",
  },
  Refusé: {
    label: "Refusé",    icon: XCircle,
    badge: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",     text: "text-red-600",
    desc: "Le client a décliné l'estimation.",
  },
  Expiré: {
    label: "Expiré",    icon: AlertCircle,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",   text: "text-amber-700",
    desc: "La date de validité est dépassée.",
  },
};

const STATUT_FLOW: DevisStatut[] = ["Brouillon", "Envoyé", "Accepté"];
const STATUTS_ALL: DevisStatut[] = ["Brouillon", "Envoyé", "Accepté", "Refusé", "Expiré"];

const NEXT_STATUT: Partial<Record<DevisStatut, { to: DevisStatut; label: string }>> = {
  Brouillon: { to: "Envoyé",  label: "Marquer comme envoyé" },
  Envoyé:    { to: "Accepté", label: "Marquer comme accepté" },
};

/* ------------------------------------------------------------------ */
/* Statut badge                                                         */
/* ------------------------------------------------------------------ */

function StatutBadge({ statut, size = "md" }: { statut: DevisStatut; size?: "sm" | "md" }) {
  const cfg = STATUT_CONFIG[statut];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-semibold",
      cfg.badge,
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
    )}>
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Vertical status stepper (sidebar)                                    */
/* ------------------------------------------------------------------ */

function VerticalStepper({
  statut, onSelect,
}: {
  statut: DevisStatut;
  onSelect: (s: DevisStatut) => void;
}) {
  const isTerminal = statut === "Refusé" || statut === "Expiré";

  if (isTerminal) {
    const cfg = STATUT_CONFIG[statut];
    const Icon = cfg.icon;
    return (
      <div className={cn(
        "flex items-center gap-2.5 rounded-xl p-3",
        statut === "Refusé" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
      )}>
        <Icon className="size-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">{statut}</p>
          <p className="text-xs opacity-70">{cfg.desc}</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUT_FLOW.indexOf(statut);

  return (
    <div>
      {STATUT_FLOW.map((s, idx) => {
        const done    = idx < currentIdx;
        const current = idx === currentIdx;
        const cfg     = STATUT_CONFIG[s];
        const Icon    = cfg.icon;
        const isLast  = idx === STATUT_FLOW.length - 1;

        return (
          <div key={s} className="flex items-start gap-3">
            {/* Connector column */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onSelect(s)}
                title={`Passer à ${s}`}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-all shrink-0",
                  done    ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600" :
                  current ? "border-blue-600 bg-blue-600 text-white cursor-default ring-4 ring-blue-100" :
                            "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {done
                  ? <CheckCircle2 className="size-4" />
                  : <Icon className="size-3.5" />}
              </button>
              {!isLast && (
                <div className={cn(
                  "w-0.5 flex-1 min-h-[28px]",
                  done ? "bg-emerald-200" : "bg-slate-100",
                )} />
              )}
            </div>

            {/* Label */}
            <div className={cn("pt-1.5", !isLast && "pb-5")}>
              <p className={cn(
                "text-sm font-semibold leading-tight",
                current ? "text-blue-700" : done ? "text-emerald-700" : "text-slate-400",
              )}>
                {s}
                {current && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    Actuel
                  </span>
                )}
              </p>
              <p className={cn(
                "mt-0.5 text-xs leading-relaxed",
                current ? "text-blue-500" : done ? "text-emerald-500" : "text-slate-300",
              )}>
                {cfg.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Info row                                                             */
/* ------------------------------------------------------------------ */

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-border/40 last:border-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={cn("mt-0.5 text-sm font-semibold text-slate-900", mono && "font-mono")}>{value || "—"}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Financial breakdown                                                  */
/* ------------------------------------------------------------------ */

function FinancialBreakdown({ devis }: { devis: Devis }) {
  const items = [
    { label: "Droits de douane",  value: devis.droitDouane,    bar: "bg-blue-500",   text: "text-blue-600" },
    { label: "Frais de circuit",  value: devis.fraisCircuit,   bar: "bg-violet-500", text: "text-violet-600" },
    { label: "Prestation SLTT",   value: devis.fraisPrestation, bar: "bg-orange-400", text: "text-orange-600" },
  ];
  return (
    <div className="p-5 space-y-3">
      {items.map((item) => {
        const pct = devis.total > 0 ? (item.value / devis.total) * 100 : 0;
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span className={cn("text-xs font-bold tabular-nums", item.text)}>{formatFCFA(item.value)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={cn("h-full rounded-full", item.bar)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-700 px-4 py-3">
        <span className="text-sm font-bold text-white">Total estimé</span>
        <span className="text-lg font-extrabold tabular-nums text-white">{formatFCFA(devis.total)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                          */
/* ------------------------------------------------------------------ */

export function DevisDetailScreen() {
  const go               = useNav((s) => s.go);
  const openDossierDetail  = useNav((s) => s.openDossierDetail);
  const selectedId       = useNav((s) => s.selectedId);
  const devisEditMode    = useNav((s) => s.devisEditMode);

  const allDevis             = useStore((s) => s.devis);
  const clients              = useStore((s) => s.clients);
  const updateDevis          = useStore((s) => s.updateDevis);
  const updateDevisStatut    = useStore((s) => s.updateDevisStatut);
  const convertDevisToDossier = useStore((s) => s.convertDevisToDossier);
  const removeDevis          = useStore((s) => s.removeDevis);
  const { toast }            = useToast();

  const devis = allDevis.find((d) => d.id === selectedId);

  const [isEditing,      setIsEditing]      = useState(devisEditMode);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [isConverting,   setIsConverting]   = useState(false); // UX-05

  /* Edit form */
  const [fClientId,        setFClientId]        = useState("");
  const [fClientNom,       setFClientNom]       = useState("");
  const [fNature,          setFNature]          = useState("");
  const [fDroitDouane,     setFDroitDouane]     = useState("");
  const [fFraisCircuit,    setFFraisCircuit]    = useState("");
  const [fFraisPrestation, setFFraisPrestation] = useState("");
  const [fDateValidite,    setFDateValidite]    = useState("");
  const [fNotes,           setFNotes]           = useState("");

  // Réinitialise le formulaire d'édition quand on entre en mode édition ou que le devis change.
  // Pattern "adjust state during rendering" — évite un rendu en cascade via useEffect.
  const editKey = isEditing ? (devis?.id ?? null) : null;
  const [prevEditKey, setPrevEditKey] = useState<string | null>(null);
  if (editKey !== prevEditKey) {
    setPrevEditKey(editKey);
    if (editKey !== null && devis) {
      setFClientId(devis.clientId);
      setFClientNom(devis.clientNom);
      setFNature(devis.nature);
      setFDroitDouane(String(devis.droitDouane));
      setFFraisCircuit(String(devis.fraisCircuit));
      setFFraisPrestation(String(devis.fraisPrestation));
      setFDateValidite(devis.dateValidite);
      setFNotes(devis.notes ?? "");
    }
  }

  /* Guard */
  if (!devis) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <FolderKanban className="size-14 text-slate-200" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Devis introuvable</p>
        <Button variant="outline" className="mt-5" onClick={() => go("devis")}>
          <ArrowLeft className="mr-2 size-4" /> Retour aux devis
        </Button>
      </div>
    );
  }

  const dd       = parseAmount(fDroitDouane);
  const fc       = parseAmount(fFraisCircuit);
  const fp       = parseAmount(fFraisPrestation);
  const editTotal = dd + fc + fp;
  const nextStatut = NEXT_STATUT[devis.statut];
  const canEdit    = !isEditing;

  /* Handlers */
  const handleClientChange = (id: string) => {
    setFClientId(id);
    const c = clients.find((c) => c.id === id);
    if (c) setFClientNom(c.nom);
  };

  const handleSave = () => {
    if (!devis || !fClientId || !fNature.trim() || !fDateValidite) return;
    updateDevis(devis.id, {
      clientId: fClientId, clientNom: fClientNom, nature: fNature,
      droitDouane: dd, fraisCircuit: fc, fraisPrestation: fp,
      dateValidite: fDateValidite,
      notes: fNotes.trim() || undefined,
    } satisfies DevisInput);
    toast({ title: "Devis mis à jour", description: devis.reference });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setConfirmDelete(false);
    setConfirmConvert(false);
  };

  const handleStatutChange = (to: DevisStatut) => {
    if (!devis) return;
    updateDevisStatut(devis.id, to);
    toast({ title: "Statut mis à jour", description: `${devis.reference} → ${to}` });
  };

  const handlePrint = () => {
    if (!devis) return;
    const client = clients.find((c) => c.id === devis.clientId);
    printDevis({
      reference: devis.reference,
      clientNom: devis.clientNom,
      clientAdresse: client?.adresse,
      clientTelephone: client?.telephone,
      clientEmail: client?.email,
      nature: devis.nature,
      dateCreation: devis.dateCreation,
      dateValidite: devis.dateValidite,
      droitDouane: devis.droitDouane,
      fraisCircuit: devis.fraisCircuit,
      fraisPrestation: devis.fraisPrestation,
      total: devis.total,
      notes: devis.notes,
      statut: devis.statut,
    });
  };

  const handleDelete = async () => {
    if (!devis) return;
    try {
      await removeDevis(devis.id);
      toast({ title: "Devis supprimé", description: devis.reference });
      go("devis");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de supprimer le devis", variant: "destructive" });
    }
  };

  const handleConvert = async () => {
    if (!devis || isConverting) return; // UX-05: guard against double-click
    setIsConverting(true);
    try {
      const dossier = await convertDevisToDossier(devis.id);
      if (dossier) {
        toast({ title: "Dossier créé", description: `${dossier.reference} ouvert depuis ${devis.reference}` });
        openDossierDetail(dossier.id);
      } else {
        setIsConverting(false);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de convertir le devis en dossier", variant: "destructive" });
      setIsConverting(false);
    }
  };

  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 pb-12">

      {/* ── Back link ── */}
      <button
        onClick={() => go("devis")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Retour aux devis
      </button>

      {/* ════════════════════════════════════════════════════════════
          SUMMARY CARD — fond blanc, bordure bleue gauche
      ════════════════════════════════════════════════════════════ */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="flex border-l-4 border-blue-600">
          <div className="flex-1 p-5 sm:p-6">
            {/* Top row: reference + total */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{devis.reference}</h1>
                  <StatutBadge statut={devis.statut} />
                </div>
                <p className="mt-1.5 text-base font-semibold text-slate-700">{devis.clientNom}</p>
                <p className="mt-0.5 text-sm text-slate-500">{devis.nature}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Créé le {formatDateShort(devis.dateCreation)}
                  &nbsp;·&nbsp; Valide jusqu'au {formatDateShort(devis.dateValidite)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Total estimé</p>
                <p className="mt-0.5 text-3xl font-extrabold tabular-nums text-blue-700 leading-tight">
                  {new Intl.NumberFormat("fr-FR").format(devis.total)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">FCFA</p>
              </div>
            </div>

            {/* Action toolbar */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
              {canEdit ? (
                <>
                  <Button size="sm" variant="outline" className="gap-2"
                    onClick={() => { setIsEditing(true); setConfirmDelete(false); setConfirmConvert(false); }}>
                    <Pencil className="size-4" /> Modifier
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="size-4" /> Télécharger PDF
                  </Button>
                  {nextStatut && (
                    <Button size="sm" className="gap-2 bg-blue-700 hover:bg-blue-800 text-white"
                      onClick={() => handleStatutChange(nextStatut.to)}>
                      <ChevronRight className="size-4" /> {nextStatut.label}
                    </Button>
                  )}
                  {devis.statut !== "Accepté" && (
                    <Button size="sm" variant="outline"
                      className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => { setConfirmConvert(true); setConfirmDelete(false); }}>
                      <FileCheck2 className="size-4" /> Convertir en dossier
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="ml-auto text-slate-400">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {STATUTS_ALL.map((s) => {
                        const SIcon = STATUT_CONFIG[s].icon;
                        return (
                          <DropdownMenuItem
                            key={s}
                            disabled={s === devis.statut}
                            onClick={() => handleStatutChange(s)}
                            className={s === devis.statut ? "opacity-50 cursor-default" : ""}
                          >
                            <SIcon className="mr-2 size-3.5" />
                            {s}
                            {s === devis.statut && <span className="ml-auto text-[10px] text-slate-400">actuel</span>}
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 focus:text-red-700"
                        onClick={() => { setConfirmDelete(true); setConfirmConvert(false); }}
                      >
                        <Trash2 className="mr-2 size-3.5" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleCancelEdit}>
                    <X className="size-4" /> Annuler
                  </Button>
                  <Button size="sm" className="gap-2 bg-blue-700 hover:bg-blue-800"
                    disabled={!fClientId || !fNature.trim() || !fDateValidite}
                    onClick={handleSave}>
                    <Save className="size-4" /> Enregistrer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════════
          VIEW MODE
      ════════════════════════════════════════════════════════════ */}
      {!isEditing && (
        <div className="grid gap-5 lg:grid-cols-5">

          {/* ── Left : info + notes ── */}
          <div className="space-y-5 lg:col-span-3">

            <Card className="border-border/80 shadow-sm">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Informations</h2>
              </div>
              <div className="px-5">
                <InfoRow icon={User}         label="Client"                   value={devis.clientNom} />
                <InfoRow icon={Package}      label="Nature de la marchandise" value={devis.nature} />
                <InfoRow icon={CalendarDays} label="Date de création"         value={formatDateShort(devis.dateCreation)} />
                <InfoRow icon={CalendarDays} label="Valide jusqu'au"          value={formatDateShort(devis.dateValidite)} />
                <InfoRow icon={Banknote}     label="Montant total estimé"     value={formatFCFA(devis.total)} />
              </div>
            </Card>

            {devis.notes && (
              <Card className="border-border/80 shadow-sm">
                <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Notes & conditions</h2>
                </div>
                <p className="px-5 py-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{devis.notes}</p>
              </Card>
            )}
          </div>

          {/* ── Right : statut + financial + actions ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* Statut card avec stepper vertical */}
            <Card className="border-border/80 shadow-sm overflow-hidden">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Pipeline</h2>
                <span className="text-[10px] text-slate-400">Cliquez pour changer</span>
              </div>
              <div className="p-5">
                <VerticalStepper statut={devis.statut} onSelect={handleStatutChange} />
                {/* Terminal statuts (Refusé / Expiré) actions */}
                {(devis.statut === "Refusé" || devis.statut === "Expiré") && (
                  <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border/40">
                    <button
                      onClick={() => handleStatutChange("Brouillon")}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      ↩ Remettre en brouillon
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Financial breakdown */}
            <Card className="border-border/80 shadow-sm overflow-hidden">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Estimation financière</h2>
              </div>
              <FinancialBreakdown devis={devis} />
            </Card>

            {/* Actions */}
            <Card className="border-border/80 shadow-sm">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2.5 font-medium" onClick={handlePrint}>
                  <Printer className="size-4 text-slate-400" /> Télécharger PDF
                </Button>
                <Button variant="outline"
                  className="w-full justify-start gap-2.5 font-medium"
                  onClick={() => { setIsEditing(true); setConfirmDelete(false); setConfirmConvert(false); }}>
                  <Pencil className="size-4 text-slate-400" /> Modifier le devis
                </Button>
                {devis.statut !== "Accepté" && (
                  <Button variant="outline"
                    className="w-full justify-start gap-2.5 font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => { setConfirmConvert(true); setConfirmDelete(false); }}>
                    <FileCheck2 className="size-4" /> Convertir en dossier
                  </Button>
                )}
                <Separator />
                <Button variant="outline"
                  className="w-full justify-start gap-2.5 font-medium text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { setConfirmDelete(true); setConfirmConvert(false); }}>
                  <Trash2 className="size-4" /> Supprimer
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          EDIT MODE — formulaire inline
      ════════════════════════════════════════════════════════════ */}
      {isEditing && (
        <Card className="border-blue-200 shadow-md overflow-hidden">
          <div className="border-b border-blue-100 bg-blue-50/80 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-700">
                <Pencil className="size-3.5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-blue-900">Modifier le devis — {devis.reference}</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client + Nature */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
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
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nature de la marchandise <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input value={fNature} onChange={(e) => setFNature(e.target.value)}
                  placeholder="ex. Matériaux de construction" className="h-10" />
              </div>
            </div>

            {/* Montants */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Estimation financière</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Droits de douane (FCFA)", val: fDroitDouane, set: setFDroitDouane },
                  { label: "Frais de circuit (FCFA)",  val: fFraisCircuit, set: setFFraisCircuit },
                  { label: "Prestation SLTT (FCFA)",   val: fFraisPrestation, set: setFFraisPrestation },
                ].map((f) => (
                  <div key={f.label} className="space-y-2">
                    <Label className="text-xs text-slate-500">{f.label}</Label>
                    <Input value={f.val} onChange={(e) => f.set(e.target.value)}
                      placeholder="0" className="h-10 text-right tabular-nums" />
                  </div>
                ))}
              </div>
              {editTotal > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <span className="text-sm font-bold text-blue-800">Total estimé</span>
                  <span className="text-lg font-extrabold tabular-nums text-blue-900">{formatFCFA(editTotal)}</span>
                </div>
              )}
            </div>

            {/* Date + Notes */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Date de validité <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input type="date" value={fDateValidite}
                  onChange={(e) => setFDateValidite(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</Label>
                <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Conditions, remarques..." rows={3} className="resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-5">
              <Button variant="ghost" size="sm" className="text-slate-500" onClick={handleCancelEdit}>
                <X className="mr-2 size-4" /> Annuler
              </Button>
              <Button className="gap-2 bg-blue-700 hover:bg-blue-800"
                disabled={!fClientId || !fNature.trim() || !fDateValidite}
                onClick={handleSave}>
                <Save className="size-4" /> Enregistrer les modifications
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════
          Conversion — confirmation inline
      ════════════════════════════════════════════════════════════ */}
      {confirmConvert && !isEditing && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200">
              <FileCheck2 className="size-6 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-900">Convertir en dossier de transit ?</h3>
              <p className="mt-1 text-sm text-emerald-800/80 leading-relaxed">
                Un nouveau dossier sera créé depuis <strong>{devis.reference}</strong> ({devis.clientNom}).
                Le statut passera à <strong>Accepté</strong> et vous serez redirigé vers la fiche dossier.
                Cette opération est irréversible.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2" onClick={handleConvert} disabled={isConverting}>
                  <CheckCircle2 className="size-4" /> {isConverting ? "Conversion…" : "Confirmer la conversion"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmConvert(false)}>Annuler</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          Suppression — zone danger inline
      ════════════════════════════════════════════════════════════ */}
      {confirmDelete && !isEditing && (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 border border-red-200">
              <AlertTriangle className="size-6 text-red-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-900">Supprimer définitivement ce devis ?</h3>
              <p className="mt-1 text-sm text-red-800/80 leading-relaxed">
                Le devis <strong>{devis.reference}</strong> ({devis.clientNom} · {formatFCFA(devis.total)})
                sera supprimé de façon permanente et irréversible.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Button size="sm" variant="destructive" className="gap-2" onClick={handleDelete}>
                  <Trash2 className="size-4" /> Confirmer la suppression
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Annuler</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
