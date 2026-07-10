"use client";

import * as React from "react";
import {
  Plus, Search, Building2, Truck, Package, UserCheck,
  Wrench, MoreHorizontal, Pencil, Trash2, Check,
  TrendingDown, TrendingUp, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useStore, type Fournisseur, type FournisseurInput, type FournisseurType, type FournisseurStatut } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { DossierFournisseurStatutBadge } from "@/components/sltt/status-badge";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EmptyState } from "@/components/sltt/empty-state";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const TYPES: FournisseurType[] = [
  "Transporteur",
  "Manutentionnaire",
  "Commissionnaire en douane",
  "Loueur",
  "Autre",
];

const TYPE_META: Record<FournisseurType, { icon: React.ElementType; color: string; bg: string }> = {
  "Transporteur":             { icon: Truck,       color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40" },
  "Manutentionnaire":         { icon: Package,     color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40" },
  "Commissionnaire en douane":{ icon: UserCheck,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  "Loueur":                   { icon: Wrench,      color: "text-indigo-600 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  "Autre":                    { icon: MoreHorizontal,color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
};

function TypeBadge({ type }: { type: FournisseurType }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", m.bg, m.color)}>
      <Icon className="size-3" />
      {type}
    </span>
  );
}

function StatutBadge({ statut }: { statut: FournisseurStatut }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
      statut === "Actif" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
    )}>
      {statut}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Form Modal                                                           */
/* ------------------------------------------------------------------ */

function FournisseurModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Fournisseur;
}) {
  const addFournisseur = useStore((s) => s.addFournisseur);
  const updateFournisseur = useStore((s) => s.updateFournisseur);
  const { toast } = useToast();

  const [nom, setNom] = React.useState(editing?.nom ?? "");
  const [type, setType] = React.useState<FournisseurType>(editing?.type ?? "Transporteur");
  const [contact, setContact] = React.useState(editing?.contact ?? "");
  const [telephone, setTelephone] = React.useState(editing?.telephone ?? "");
  const [email, setEmail] = React.useState(editing?.email ?? "");
  const [adresse, setAdresse] = React.useState(editing?.adresse ?? "");
  const [tarif, setTarif] = React.useState(editing?.tarifContractuel ? String(editing.tarifContractuel) : "");
  const [statut, setStatut] = React.useState<FournisseurStatut>(editing?.statut ?? "Actif");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    const input: FournisseurInput = {
      nom: nom.trim(),
      type,
      contact: contact.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      adresse: adresse.trim(),
      tarifContractuel: tarif ? parseFloat(tarif) : undefined,
      statut,
    };
    if (editing) {
      updateFournisseur(editing.id, input);
      toast({ title: "Fournisseur mis à jour", description: nom });
    } else {
      addFournisseur(input);
      toast({ title: "Fournisseur créé", description: nom });
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
          <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Raison sociale *</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du prestataire" className="h-10" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Type de prestataire *</Label>
              <Select value={type} onValueChange={(v) => setType(v as FournisseurType)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => setStatut(v as FournisseurStatut)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Personne de contact</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Prénom Nom" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+223 ..." className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@..." className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Tarif contractuel (FCFA)</Label>
              <Input type="number" value={tarif} onChange={(e) => setTarif(e.target.value)} placeholder="0" className="h-10" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Adresse</Label>
              <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse complète" className="h-10" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={!nom.trim()}>
              <Check className="size-4" />
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Main Screen                                                          */
/* ------------------------------------------------------------------ */

export function FournisseursScreen() {
  const { go } = useNav();
  const { toast } = useToast();
  const fournisseurs        = useStore((s) => s.fournisseurs);
  const dossierFournisseurs = useStore((s) => s.dossierFournisseurs);
  const dossiers            = useStore((s) => s.dossiers);
  const removeFournisseur   = useStore((s) => s.removeFournisseur);

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<FournisseurType | "Tous">("Tous");
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Fournisseur | undefined>();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return fournisseurs.filter((f) => {
      if (typeFilter !== "Tous" && f.type !== typeFilter) return false;
      if (q && !f.nom.toLowerCase().includes(q) && !f.contact.toLowerCase().includes(q) && !f.type.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fournisseurs, search, typeFilter]);

  // KPIs
  const totalMontant   = React.useMemo(() => dossierFournisseurs.reduce((s, df) => s + df.montantReel, 0), [dossierFournisseurs]);
  const totalBudgete   = React.useMemo(() => dossierFournisseurs.reduce((s, df) => s + df.montantBudgete, 0), [dossierFournisseurs]);
  const actifs         = fournisseurs.filter((f) => f.statut === "Actif").length;
  const enAttente      = dossierFournisseurs.filter((df) => df.statut === "En attente").length;

  // Liaisons dossiers enrichies
  const liaisonsEnrichies = React.useMemo(() =>
    dossierFournisseurs.slice(0, 20).map((df) => ({
      ...df,
      dossier: dossiers.find((d) => d.id === df.dossierId),
    })),
    [dossierFournisseurs, dossiers]
  );

  function handleEdit(f: Fournisseur) {
    setEditing(f);
    setShowForm(true);
  }

  function handleDelete() {
    if (!deleteId) return;
    const f = fournisseurs.find((x) => x.id === deleteId);
    removeFournisseur(deleteId);
    setDeleteId(null);
    toast({ title: "Fournisseur supprimé", description: f?.nom });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fournisseurs" description="Prestataires externes, tarifs contractuels et suivi des coûts">
        <Button onClick={() => { setEditing(undefined); setShowForm(true); }}>
          <Plus className="size-4" />
          Nouveau fournisseur
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard compact label="Fournisseurs actifs" value={String(actifs)} icon={Building2} tone="blue" />
        <KpiCard compact label="Total sous-traité" value={formatFCFA(totalMontant)} icon={TrendingDown} tone="red" />
        <KpiCard compact label="Budget alloué" value={formatFCFA(totalBudgete)} icon={TrendingUp} tone="indigo" />
        <KpiCard compact label="Paiements en attente" value={String(enAttente)} icon={AlertCircle} tone="amber" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fournisseur…"
            className="h-9 pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["Tous", ...TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as FournisseurType | "Tous")}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                typeFilter === t ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Fournisseurs list */}
      <div className="rounded-xl border border-border/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 bg-slate-50 dark:bg-slate-800 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <span>Type</span>
          <span>Prestataire</span>
          <span className="text-right hidden sm:block">Tarif contractuel</span>
          <span className="text-right hidden sm:block">Montant total</span>
          <span>Statut</span>
          <span />
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={Building2}
            title="Aucun fournisseur trouvé"
            description="Modifiez les filtres ou créez un nouveau prestataire."
            action={
              <Button size="sm" onClick={() => { setEditing(undefined); setShowForm(true); }}>
                <Plus className="mr-1.5 size-3.5" /> Nouveau fournisseur
              </Button>
            }
            className="m-4 border-0 bg-transparent"
          />
        )}
        {filtered.map((f) => {
          const m = TYPE_META[f.type];
          const Icon = m.icon;
          return (
            <div key={f.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 border-t border-border/60 px-5 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
              <div className={cn("flex size-8 items-center justify-center rounded-lg", m.bg)}>
                <Icon className={cn("size-4", m.color)} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{f.nom}</p>
                <p className="truncate text-xs text-slate-400 dark:text-slate-500">{f.contact} · {f.telephone}</p>
              </div>
              <p className="hidden text-right text-sm tabular-nums text-slate-500 dark:text-slate-400 sm:block">
                {f.tarifContractuel ? formatFCFA(f.tarifContractuel) : "—"}
              </p>
              <p className="hidden text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200 sm:block">
                {formatFCFA(f.montantTotal)}
              </p>
              <StatutBadge statut={f.statut} />
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="size-8" onClick={() => handleEdit(f)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setDeleteId(f.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dernières liaisons dossiers */}
      <div className="rounded-xl border border-border/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dernières liaisons dossiers</h2>
          <Badge variant="secondary" className="text-[10px]">{dossierFournisseurs.length} prestation(s)</Badge>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 bg-slate-50 dark:bg-slate-800 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <span>Prestataire / Dossier</span>
          <span className="hidden sm:block">Description</span>
          <span className="text-right">Budgété</span>
          <span className="text-right">Réel</span>
          <span>Écart</span>
          <span>Statut</span>
        </div>
        {liaisonsEnrichies.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Aucune liaison dossier enregistrée.</div>
        )}
        {liaisonsEnrichies.map((df) => {
          const ecart = df.montantReel - df.montantBudgete;
          return (
            <div key={df.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 border-t border-border/60 px-5 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{df.fournisseurNom}</p>
                <button
                  onClick={() => go("dossier-detail", { id: df.dossierId })}
                  className="truncate text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {df.dossierRef ?? df.dossierId} · {formatDateShort(df.date)}
                </button>
              </div>
              <p className="hidden max-w-[160px] truncate text-xs text-slate-500 dark:text-slate-400 sm:block">{df.description}</p>
              <p className="text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">{formatFCFA(df.montantBudgete)}</p>
              <p className="text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">{formatFCFA(df.montantReel)}</p>
              <p className={cn("text-sm font-semibold tabular-nums", ecart > 0 ? "text-red-600 dark:text-red-400" : ecart < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")}>
                {ecart > 0 ? "+" : ""}{formatFCFA(ecart)}
              </p>
              <DossierFournisseurStatutBadge statut={df.statut} />
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      <FournisseurModal open={showForm} onClose={() => { setShowForm(false); setEditing(undefined); }} editing={editing} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{fournisseurs.find((f) => f.id === deleteId)?.nom}</strong> sera définitivement supprimé. Les liaisons existantes sur les dossiers ne seront pas affectées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
