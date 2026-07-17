"use client";

import * as React from "react";
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  XCircle,
  CreditCard,
  Pencil,
  Save,
  X,
  Plus,
  Clock,
  AlertTriangle,
  User,
  CalendarDays,
  Receipt,
  FolderKanban,
  Banknote,
  FileText,
  MoreHorizontal,
  ChevronRight,
  Percent,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useStore,
  type Facture,
  type FactureStatut,
  type FactureInput,
} from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { printFactureModule, shouldShowTva } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { canTransitionFacture, FACTURE_ALLOWED_TRANSITIONS } from "@/lib/status-flow";
import { FactureStatutBadge } from "@/components/sltt/status-badge";

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

const STATUT_CONFIG: Record<FactureStatut, StatutCfg> = {
  Brouillon: {
    label: "Brouillon",
    icon: Clock,
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-700 dark:text-slate-300",
    desc: "Facture en cours de rédaction.",
  },
  Envoyée: {
    label: "Envoyée",
    icon: Send,
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    desc: "Transmise au client, en attente de règlement.",
  },
  Partielle: {
    label: "Partielle",
    icon: Banknote,
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    desc: "Un paiement partiel a été enregistré.",
  },
  Soldée: {
    label: "Soldée",
    icon: CheckCircle2,
    badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    desc: "Facture intégralement réglée.",
  },
  Annulée: {
    label: "Annulée",
    icon: XCircle,
    badge: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    desc: "Cette facture a été annulée.",
  },
};

const STATUT_FLOW: FactureStatut[] = ["Brouillon", "Envoyée", "Partielle", "Soldée"];
const STATUTS_ALL: FactureStatut[] = ["Brouillon", "Envoyée", "Partielle", "Soldée", "Annulée"];

const NEXT_STATUT: Partial<Record<FactureStatut, { to: FactureStatut; label: string }>> = {
  Brouillon: { to: "Envoyée", label: "Marquer comme envoyée" },
  Envoyée: { to: "Partielle", label: "Marquer partiellement payée" },
  Partielle: { to: "Soldée", label: "Marquer comme soldée" },
};

/* ------------------------------------------------------------------ */
/* Sous-composants                                                      */
/* ------------------------------------------------------------------ */

function InfoRow({
  icon: Icon,
  label,
  value,
  warn,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  warn?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-3.5 last:border-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm font-semibold",
            warn ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100",
            mono && "font-mono text-xs",
          )}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function VerticalStepper({
  statut,
  onSelect,
}: {
  statut: FactureStatut;
  onSelect: (s: FactureStatut) => void;
}) {
  if (statut === "Annulée") {
    const cfg = STATUT_CONFIG.Annulée;
    const Icon = cfg.icon;
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950/40">
        <Icon className="size-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">Annulée</p>
          <p className="text-xs opacity-70">{cfg.desc}</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUT_FLOW.indexOf(statut);
  const allowedNext = FACTURE_ALLOWED_TRANSITIONS[statut] ?? [];

  return (
    <div>
      {STATUT_FLOW.map((s, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        const clickable = !done && !current && allowedNext.includes(s);
        const cfg = STATUT_CONFIG[s];
        const Icon = cfg.icon;
        const isLast = idx === STATUT_FLOW.length - 1;

        return (
          <div key={s} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <button
                onClick={() => clickable && onSelect(s)}
                disabled={!clickable}
                title={clickable ? `Passer à ${s}` : s}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  done
                    ? "cursor-default border-emerald-500 bg-emerald-500 text-white"
                    : current
                      ? "cursor-default border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950"
                      : clickable
                        ? "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700",
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}
              </button>
              {!isLast && (
                <div
                  className={cn(
                    "min-h-[28px] w-0.5 flex-1",
                    done ? "bg-emerald-200" : "bg-slate-100 dark:bg-slate-800",
                  )}
                />
              )}
            </div>
            <div className={cn("pt-1.5", !isLast && "pb-5")}>
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  current
                    ? "text-blue-700"
                    : done
                      ? "text-emerald-700"
                      : "text-slate-400 dark:text-slate-500",
                )}
              >
                {s}
                {current && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    Actuel
                  </span>
                )}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs leading-relaxed",
                  current
                    ? "text-blue-500"
                    : done
                      ? "text-emerald-500"
                      : "text-slate-300 dark:text-slate-600",
                )}
              >
                {cfg.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentRing({ pct, reste, isEchue }: { pct: number; reste: number; isEchue: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0">
        <svg className="-rotate-90 size-20" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={cn(
              "transition-all duration-500",
              pct >= 100 ? "text-emerald-500" : isEchue ? "text-red-500" : "text-blue-600",
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{pct}%</span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">payé</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Reste à payer</p>
        <p
          className={cn(
            "mt-0.5 text-xl font-extrabold tabular-nums leading-tight",
            reste === 0 ? "text-emerald-600" : isEchue ? "text-red-600" : "text-amber-700",
          )}
        >
          {formatFCFA(reste)}
        </p>
      </div>
    </div>
  );
}

function LignesTable({ lignes }: { lignes: Facture["lignes"] }) {
  if (lignes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <FileText className="size-8 text-slate-200 dark:text-slate-700" />
        <p className="mt-2 text-sm text-slate-400">Aucune ligne de facturation</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 p-4 sm:hidden">
        {lignes.map((l) => (
          <div key={l.id} className="rounded-lg border border-border/60 p-3">
            <p className="font-medium text-slate-800 dark:text-slate-200">{l.description}</p>
            <dl className="mt-1.5 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Qté × P.U. HT</dt>
                <dd className="tabular-nums text-slate-600 dark:text-slate-300">{l.quantite} × {formatFCFA(l.prixUnitaire)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Total HT</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatFCFA(l.montantHT)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-slate-50/80 dark:bg-slate-800/50">
              <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Description
              </th>
              <th className="w-16 px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Qté
              </th>
              <th className="w-32 px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                P.U. HT
              </th>
              <th className="w-36 px-5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Total HT
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {lignes.map((l, i) => (
              <tr key={l.id} className={cn(i % 2 === 1 && "bg-slate-50/40 dark:bg-slate-800/20")}>
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{l.description}</td>
                <td className="px-3 py-3 text-center tabular-nums text-slate-500">{l.quantite}</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {formatFCFA(l.prixUnitaire)}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatFCFA(l.montantHT)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FinancialSummary({
  montantHT,
  tauxTVA,
  montantTVA,
  montantTTC,
  montantPaye,
  editMode,
  editMontantHT,
  editTVA,
  editTTC,
}: {
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  editMode?: boolean;
  editMontantHT?: number;
  editTVA?: number;
  editTTC?: number;
}) {
  const ht = editMode ? (editMontantHT ?? 0) : montantHT;
  const tva = editMode ? (editTVA ?? 0) : tauxTVA;
  const tvaAmt = editMode ? Math.round(ht * (tva / 100)) : montantTVA;
  const ttc = editMode ? (editTTC ?? 0) : montantTTC;
  const reste = Math.max(0, ttc - montantPaye);

  return (
    <div className="space-y-2 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Sous-total HT</span>
        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(ht)}</span>
      </div>
      {shouldShowTva(tva) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">TVA {tva}%</span>
          <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(tvaAmt)}</span>
        </div>
      )}
      <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3">
        <span className="text-sm font-bold text-white">Total TTC</span>
        <span className="text-lg font-extrabold tabular-nums text-white">{formatFCFA(ttc)}</span>
      </div>
      {!editMode && montantPaye > 0 && (
        <>
          <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400">
            <span>Déjà payé</span>
            <span className="font-semibold tabular-nums">- {formatFCFA(montantPaye)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-2 text-sm font-bold">
            <span className="text-slate-700 dark:text-slate-300">Reste à payer</span>
            <span className={cn("tabular-nums", reste > 0 ? "text-amber-700" : "text-emerald-600")}>
              {formatFCFA(reste)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog paiement                                                      */
/* ------------------------------------------------------------------ */

function PaiementDialog({
  facture,
  open,
  onOpenChange,
}: {
  facture: Facture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const recordPaiement = useStore((s) => s.recordFacturePaiement);
  const reste = facture.montantTTC - facture.montantPaye;
  const [montant, setMontant] = React.useState(String(reste));
  const [saving, setSaving] = React.useState(false);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setMontant(String(reste));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!m || m <= 0) {
      toast({ title: "Montant invalide", description: "Le montant doit être supérieur à 0.", variant: "destructive" });
      return;
    }
    if (m > reste) {
      toast({
        title: "Montant trop élevé",
        description: `Le reste à payer est de ${reste.toLocaleString("fr-FR")} FCFA.`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await recordPaiement(facture.id, m);
      toast({ title: "Paiement enregistré", description: `${m.toLocaleString("fr-FR")} FCFA encaissés.` });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer le paiement.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-labelledby="paiement-dialog-title">
        <DialogHeader>
          <DialogTitle id="paiement-dialog-title" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
              <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            Facture <span className="font-mono font-semibold">{facture.numero}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Total TTC", value: formatFCFA(facture.montantTTC), color: "text-slate-700 dark:text-slate-300" },
              { label: "Déjà payé", value: formatFCFA(facture.montantPaye), color: "text-emerald-700 dark:text-emerald-400" },
              { label: "Reste", value: formatFCFA(reste), color: "text-amber-700 dark:text-amber-400" },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-xl border border-border/60 bg-slate-50/80 p-2 dark:bg-slate-800/50 sm:p-3">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className={cn("mt-1 break-words text-xs font-bold tabular-nums sm:text-sm", item.color)}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paiement-montant" className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Montant reçu (FCFA)
            </Label>
            <Input
              id="paiement-montant"
              type="number"
              min="1"
              max={reste}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              autoFocus
              className="h-11 text-right text-base font-semibold tabular-nums"
              required
            />
            <div className="flex gap-2">
              {[25, 50, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setMontant(String(Math.round((reste * pct) / 100)))}
                  className="rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800"
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMontant(String(reste))}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40"
              >
                Solde
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle2 className="mr-1.5 size-3.5" />
              {saving ? "Enregistrement…" : "Valider le paiement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Écran principal                                                      */
/* ------------------------------------------------------------------ */

export function FactureDetailScreen() {
  const selectedId = useNav((s) => s.selectedId);
  const go = useNav((s) => s.go);
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const factures = useStore((s) => s.factures);
  const societes = useStore((s) => s.societes);
  const updateFactureStatut = useStore((s) => s.updateFactureStatut);
  const updateFacture = useStore((s) => s.updateFacture);
  const dossiers = useStore((s) => s.dossiers);
  const { toast } = useToast();

  const facture = factures.find((f) => f.id === selectedId);

  const [showPaiement, setShowPaiement] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [confirmSolde, setConfirmSolde] = React.useState(false);

  const [editDate, setEditDate] = React.useState("");
  const [editDateEcheance, setEditDateEcheance] = React.useState("");
  const [editTvaOn, setEditTvaOn] = React.useState(true);
  const [editSocieteId, setEditSocieteId] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [editLignes, setEditLignes] = React.useState<
    Array<{ description: string; quantite: string; prixUnitaire: string }>
  >([]);

  const editKey = isEditing ? (facture?.id ?? null) : null;
  const [prevEditKey, setPrevEditKey] = React.useState(editKey);
  if (editKey !== prevEditKey) {
    setPrevEditKey(editKey);
    if (editKey !== null && facture) {
      setEditDate(facture.date);
      setEditDateEcheance(facture.dateEcheance);
      setEditTvaOn(facture.tauxTVA > 0);
      setEditSocieteId(facture.societeId ?? "");
      setEditNotes(facture.notes);
      setEditLignes(
        facture.lignes.map((l) => ({
          description: l.description,
          quantite: String(l.quantite),
          prixUnitaire: String(l.prixUnitaire),
        })),
      );
    }
  }

  if (!facture) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <Receipt className="size-14 text-slate-200 dark:text-slate-700" />
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Facture introuvable</p>
        <Button variant="outline" className="mt-5" onClick={() => go("factures")}>
          <ArrowLeft className="mr-2 size-4" /> Retour aux factures
        </Button>
      </div>
    );
  }

  const dossier = facture.dossierId ? dossiers.find((d) => d.id === facture.dossierId) : null;
  const reste = facture.montantTTC - facture.montantPaye;
  const pctPaye = facture.montantTTC > 0 ? Math.round((facture.montantPaye / facture.montantTTC) * 100) : 0;
  const isEchue =
    facture.statut !== "Soldée" &&
    facture.statut !== "Annulée" &&
    facture.dateEcheance < new Date().toISOString().slice(0, 10);
  const nextStatut = NEXT_STATUT[facture.statut];
  const canEdit = facture.statut === "Brouillon" && !isEditing;

  const editMontantHT = editLignes.reduce(
    (s, l) => s + (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaire) || 0),
    0,
  );
  const editTVA = editTvaOn ? 18 : 0;
  const editTTC = editMontantHT + Math.round(editMontantHT * (editTVA / 100));

  async function handleStatutClick(s: FactureStatut) {
    if (!facture) return;
    if (s === facture.statut) return;
    if (s === "Soldée" && facture.montantPaye < facture.montantTTC) {
      setConfirmSolde(true);
      return;
    }
    try {
      await updateFactureStatut(facture.id, s);
      toast({ title: "Statut mis à jour", description: `${facture.numero} → ${s}` });
    } catch (err: unknown) {
      toast({
        title: "Transition impossible",
        description: err instanceof Error ? err.message : "Cette transition de statut n'est pas autorisée.",
        variant: "destructive",
      });
    }
  }

  function handleSaveEdit() {
    if (!facture) return;
    const input: FactureInput = {
      dossierId: facture.dossierId,
      clientId: facture.clientId,
      clientNom: facture.clientNom,
      societeId: editSocieteId || null,
      date: editDate,
      dateEcheance: editDateEcheance,
      tauxTVA: editTvaOn ? 18 : 0,
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
    toast({ title: "Facture mise à jour", description: facture.numero });
    setIsEditing(false);
  }

  function handlePrint() {
    if (!facture) return;
    printFactureModule({
      numero: facture.numero,
      clientNom: facture.clientNom,
      date: facture.date,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      lignes: facture.lignes,
      tauxTVA: facture.tauxTVA,
      montantHT: facture.montantHT,
      montantTVA: facture.montantTVA,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye,
      notes: facture.notes,
      creePar: facture.creePar,
      creeLe: facture.creeLe,
      dossierReference: dossier?.reference,
      dossierBl: dossier?.bl,
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {showPaiement && (
        <PaiementDialog facture={facture} open={showPaiement} onOpenChange={setShowPaiement} />
      )}

      {/* Retour */}
      <button
        onClick={() => go("factures")}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Retour aux factures
      </button>

      {/* Carte résumé */}
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div className="flex border-l-4 border-blue-600">
          <div className="flex-1 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {facture.numero}
                  </h1>
                  <FactureStatutBadge statut={facture.statut} showIcon size="md" />
                  {dossier && (
                    <button
                      onClick={() => openDossierDetail(dossier.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                    >
                      <FolderKanban className="size-3" />
                      {dossier.reference}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-base font-semibold text-slate-700 dark:text-slate-300">{facture.clientNom}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Émise le {formatDateShort(facture.date)}
                  &nbsp;·&nbsp; Échéance {formatDateShort(facture.dateEcheance)}
                  &nbsp;·&nbsp; Créée par {facture.creePar}
                </p>
                {isEchue && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <AlertTriangle className="size-3.5" />
                    Échéance dépassée depuis le {formatDateShort(facture.dateEcheance)}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Total TTC</p>
                <p className="mt-0.5 text-3xl font-extrabold tabular-nums leading-tight text-blue-700">
                  {new Intl.NumberFormat("fr-FR").format(facture.montantTTC)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">FCFA</p>
                {facture.montantPaye > 0 && facture.statut !== "Soldée" && (
                  <p className="mt-1 text-xs font-semibold text-amber-600">
                    Reste {formatFCFA(reste)}
                  </p>
                )}
              </div>
            </div>

            {/* Barre d'actions */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
              {!isEditing ? (
                <>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="size-4" /> Télécharger PDF
                  </Button>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="size-4" /> Modifier
                    </Button>
                  )}
                  {facture.statut !== "Soldée" && facture.statut !== "Annulée" && (
                    <Button
                      size="sm"
                      className="gap-2 bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => setShowPaiement(true)}
                    >
                      <CreditCard className="size-4" /> Enregistrer paiement
                    </Button>
                  )}
                  {nextStatut && facture.statut !== "Annulée" && (
                    <Button
                      size="sm"
                      className="gap-2 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => handleStatutClick(nextStatut.to)}
                    >
                      <ChevronRight className="size-4" /> {nextStatut.label}
                    </Button>
                  )}
                  {dossier && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-indigo-950/40"
                      onClick={() => openDossierDetail(dossier.id)}
                    >
                      <FolderKanban className="size-4" /> Voir le dossier
                    </Button>
                  )}
                  {facture.statut !== "Annulée" && facture.statut !== "Soldée" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="ml-auto text-slate-400">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        {STATUTS_ALL.filter((s) => s !== "Annulée").map((s) => {
                          const SIcon = STATUT_CONFIG[s].icon;
                          const disabled = s === facture.statut || !canTransitionFacture(facture.statut, s);
                          return (
                            <DropdownMenuItem
                              key={s}
                              disabled={disabled}
                              onClick={() => handleStatutClick(s)}
                            >
                              <SIcon className="mr-2 size-3.5" />
                              {s}
                              {s === facture.statut && (
                                <span className="ml-auto text-[10px] text-slate-400">actuel</span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40"
                          onClick={() => handleStatutClick("Annulée")}
                        >
                          <XCircle className="mr-2 size-3.5" /> Annuler la facture
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsEditing(false)}>
                    <X className="size-4" /> Annuler
                  </Button>
                  <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleSaveEdit}>
                    <Save className="size-4" /> Enregistrer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Mode visualisation */}
      {!isEditing && (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Colonne gauche */}
          <div className="space-y-5 lg:col-span-3">
            <Card className="border-border/80 shadow-sm">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Informations</h2>
              </div>
              <div className="px-5">
                <InfoRow icon={User} label="Client" value={facture.clientNom} />
                <InfoRow icon={Receipt} label="N° Facture" value={facture.numero} mono />
                <InfoRow icon={CalendarDays} label="Date d'émission" value={formatDateShort(facture.date)} />
                <InfoRow
                  icon={CalendarDays}
                  label="Date d'échéance"
                  value={formatDateShort(facture.dateEcheance)}
                  warn={isEchue}
                />
                {shouldShowTva(facture.tauxTVA) && (
                  <InfoRow icon={Percent} label="Taux de TVA" value={`${facture.tauxTVA} %`} />
                )}
                <InfoRow icon={Building2} label="Société" value={facture.societeNom ?? "—"} />
                <InfoRow
                  icon={FolderKanban}
                  label="Dossier lié"
                  value={dossier ? `${dossier.reference} · BL ${dossier.bl}` : "—"}
                />
                <InfoRow icon={Clock} label="Créée le" value={formatDateShort(facture.creeLe)} />
              </div>
            </Card>

            <Card className="overflow-hidden border-border/80 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Lignes de facturation
                </h2>
                <span className="text-[10px] tabular-nums text-slate-400">
                  {facture.lignes.length} ligne{facture.lignes.length !== 1 ? "s" : ""}
                </span>
              </div>
              <LignesTable lignes={facture.lignes} />
              <div className="border-t border-border/60 bg-slate-50/30 dark:bg-slate-800/30">
                <FinancialSummary
                  montantHT={facture.montantHT}
                  tauxTVA={facture.tauxTVA}
                  montantTVA={facture.montantTVA}
                  montantTTC={facture.montantTTC}
                  montantPaye={facture.montantPaye}
                />
              </div>
            </Card>

            {facture.notes && (
              <Card className="border-border/80 shadow-sm">
                <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Notes</h2>
                </div>
                <p className="px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {facture.notes}
                </p>
              </Card>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-5 lg:col-span-2">
            {facture.statut !== "Annulée" && (
              <Card className="overflow-hidden border-border/80 shadow-sm">
                <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Suivi paiement</h2>
                </div>
                <div className="space-y-4 p-5">
                  <PaymentRing pct={pctPaye} reste={reste} isEchue={isEchue} />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Encaissé</p>
                      <p className="mt-1 text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatFCFA(facture.montantPaye)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total TTC</p>
                      <p className="mt-1 text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">
                        {formatFCFA(facture.montantTTC)}
                      </p>
                    </div>
                  </div>
                  {facture.statut !== "Soldée" && (
                    <Button className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800" onClick={() => setShowPaiement(true)}>
                      <CreditCard className="size-4" /> Enregistrer un paiement
                    </Button>
                  )}
                </div>
              </Card>
            )}

            <Card className="overflow-hidden border-border/80 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Pipeline</h2>
                <span className="text-[10px] text-slate-400">Cliquez pour changer</span>
              </div>
              <div className="p-5">
                <VerticalStepper statut={facture.statut} onSelect={handleStatutClick} />
                {facture.statut === "Annulée" && (
                  <button
                    onClick={() => handleStatutClick("Brouillon")}
                    className="mt-4 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400"
                  >
                    ↩ Remettre en brouillon
                  </button>
                )}
              </div>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Actions</h2>
              </div>
              <div className="space-y-2 p-4">
                <Button variant="outline" className="w-full justify-start gap-2.5 font-medium" onClick={handlePrint}>
                  <Printer className="size-4 text-slate-400" /> Télécharger PDF
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5 font-medium"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="size-4 text-slate-400" /> Modifier la facture
                  </Button>
                )}
                {facture.statut !== "Soldée" && facture.statut !== "Annulée" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5 font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/40"
                    onClick={() => setShowPaiement(true)}
                  >
                    <CreditCard className="size-4" /> Enregistrer un paiement
                  </Button>
                )}
                {dossier && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5 font-medium text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-indigo-950/40"
                    onClick={() => openDossierDetail(dossier.id)}
                  >
                    <FolderKanban className="size-4" /> Voir le dossier lié
                  </Button>
                )}
                {facture.statut !== "Annulée" && facture.statut !== "Soldée" && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2.5 font-medium text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:bg-red-950/40"
                      onClick={() => handleStatutClick("Annulée")}
                    >
                      <XCircle className="size-4" /> Annuler la facture
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Mode édition */}
      {isEditing && (
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
                Appliquer la TVA (18 %)
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
      )}

      <AlertDialog open={confirmSolde} onOpenChange={setConfirmSolde}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer cette facture comme soldée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le montant payé sera fixé à <strong>{formatFCFA(facture.montantTTC)}</strong> (montant total
              TTC), alors que <strong>{formatFCFA(facture.montantPaye)}</strong> seulement a été enregistré
              jusqu&apos;ici. À utiliser uniquement si le client a réellement réglé la totalité par un autre
              moyen que ce module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await updateFactureStatut(facture.id, "Soldée");
                  toast({ title: "Statut mis à jour", description: `${facture.numero} → Soldée` });
                } catch (err: unknown) {
                  toast({
                    title: "Transition impossible",
                    description: err instanceof Error ? err.message : "Cette transition de statut n'est pas autorisée.",
                    variant: "destructive",
                  });
                }
                setConfirmSolde(false);
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
