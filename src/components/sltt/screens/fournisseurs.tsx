"use client";

import * as React from "react";
import {
  Plus,
  Building2,
  Truck,
  Package,
  UserCheck,
  Wrench,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Handshake,
  Banknote,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  useStore,
  type Fournisseur,
  type FournisseurInput,
  type FournisseurType,
  type FournisseurStatut,
} from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { ActifStatutBadge, DossierFournisseurStatutBadge } from "@/components/sltt/status-badge";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EmptyState } from "@/components/sltt/empty-state";
import { ListFilters, type FilterChip } from "@/components/sltt/list-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { MetaTabsList, type MetaTabItem } from "@/components/sltt/meta-tabs-list";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { matchesQuery } from "@/lib/search-filter";
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

const TYPE_META: Record<
  FournisseurType,
  { icon: LucideIcon; color: string; bg: string; short: string }
> = {
  Transporteur: {
    icon: Truck,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    short: "Transport",
  },
  Manutentionnaire: {
    icon: Package,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    short: "Manutention",
  },
  "Commissionnaire en douane": {
    icon: UserCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    short: "Douane",
  },
  Loueur: {
    icon: Wrench,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    short: "Location",
  },
  Autre: {
    icon: MoreHorizontal,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    short: "Autre",
  },
};

type FournisseurTab = "prestataires" | "tarifs" | "couts";

const TAB_META: (MetaTabItem<FournisseurTab> & { description: string })[] = [
  {
    key: "prestataires",
    label: "Prestataires",
    shortLabel: "Prestataires",
    description: "Annuaire des prestataires externes et contacts opérationnels.",
    icon: Handshake,
    iconWrap:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "tarifs",
    label: "Tarifs",
    shortLabel: "Tarifs",
    description: "Tarifs contractuels et montants cumulés par prestataire.",
    icon: Banknote,
    iconWrap:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "couts",
    label: "Suivi des coûts",
    shortLabel: "Coûts",
    description: "Liaisons dossiers — budget, réel et écarts de sous-traitance.",
    icon: Link2,
    iconWrap:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
];

function TypeBadge({ type }: { type: FournisseurType }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-[11px] font-semibold",
        m.bg,
        m.color,
      )}
    >
      <Icon className="size-3" />
      <span className="hidden lg:inline">{type}</span>
      <span className="lg:hidden">{m.short}</span>
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
  const [tarif, setTarif] = React.useState(
    editing?.tarifContractuel ? String(editing.tarifContractuel) : "",
  );
  const [statut, setStatut] = React.useState<FournisseurStatut>(editing?.statut ?? "Actif");

  const resetKey = open ? (editing?.id ?? "new") : null;
  const [prevResetKey, setPrevResetKey] = React.useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (resetKey !== null) {
      setNom(editing?.nom ?? "");
      setType(editing?.type ?? "Transporteur");
      setContact(editing?.contact ?? "");
      setTelephone(editing?.telephone ?? "");
      setEmail(editing?.email ?? "");
      setAdresse(editing?.adresse ?? "");
      setTarif(editing?.tarifContractuel ? String(editing.tarifContractuel) : "");
      setStatut(editing?.statut ?? "Actif");
    }
  }

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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
          <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>
                Raison sociale <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom du prestataire"
                className="h-10"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type de prestataire</Label>
              <Select value={type} onValueChange={(v) => setType(v as FournisseurType)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => setStatut(v as FournisseurStatut)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Personne de contact</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Prénom Nom"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+223 ..."
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@..."
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tarif contractuel (FCFA)</Label>
              <Input
                type="number"
                value={tarif}
                onChange={(e) => setTarif(e.target.value)}
                placeholder="0"
                className="h-10"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Adresse</Label>
              <Input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Adresse complète"
                className="h-10"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
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
/* Row lists                                                            */
/* ------------------------------------------------------------------ */

function PrestatairesTable({
  items,
  canWrite,
  onEdit,
  onDelete,
  emptyAction,
}: {
  items: Fournisseur[];
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
  onDelete: (id: string) => void;
  emptyAction?: React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="Aucun prestataire trouvé"
        description="Modifiez les filtres ou créez un nouveau prestataire."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm dark:bg-slate-900">
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5">
        <span className="sr-only sm:not-sr-only sm:w-9">Type</span>
        <span>Prestataire</span>
        <span className="hidden text-right sm:block">Contact</span>
        <span>Statut</span>
        <span className="w-16" />
      </div>
      {items.map((f) => {
        const m = TYPE_META[f.type];
        const Icon = m.icon;
        return (
          <div
            key={f.id}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5"
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", m.bg)}>
              <Icon className={cn("size-[18px]", m.color)} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {f.nom}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <TypeBadge type={f.type} />
                <span className="truncate text-xs text-slate-400 dark:text-slate-500 sm:hidden">
                  {f.contact || f.telephone || "—"}
                </span>
              </div>
            </div>
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                {f.contact || "—"}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {f.telephone || f.email || "—"}
              </p>
            </div>
            <ActifStatutBadge statut={f.statut} />
            <div className="flex items-center justify-end gap-0.5">
              {canWrite && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Modifier ${f.nom}`}
                    onClick={() => onEdit(f)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    aria-label={`Supprimer ${f.nom}`}
                    onClick={() => onDelete(f.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TarifsTable({
  items,
  canWrite,
  onEdit,
  emptyAction,
}: {
  items: Fournisseur[];
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
  emptyAction?: React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="Aucun tarif à afficher"
        description="Aucun prestataire ne correspond aux filtres."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm dark:bg-slate-900">
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5">
        <span className="w-10" />
        <span>Prestataire</span>
        <span className="text-right">Tarif contractuel</span>
        <span className="hidden text-right sm:block">Cumul dossiers</span>
        <span className="w-10" />
      </div>
      {items.map((f) => {
        const m = TYPE_META[f.type];
        const Icon = m.icon;
        const hasTarif = f.tarifContractuel != null;
        return (
          <div
            key={f.id}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5"
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", m.bg)}>
              <Icon className={cn("size-[18px]", m.color)} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {f.nom}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <TypeBadge type={f.type} />
                <span className="text-slate-400">
                  {f.nbDossiers} dossier{f.nbDossiers === 1 ? "" : "s"}
                </span>
              </p>
            </div>
            <p
              className={cn(
                "text-right text-sm tabular-nums",
                hasTarif
                  ? "font-semibold text-violet-700 dark:text-violet-300"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              {hasTarif ? formatFCFA(f.tarifContractuel!) : "Non défini"}
            </p>
            <p className="hidden text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200 sm:block">
              {formatFCFA(f.montantTotal)}
            </p>
            <div className="flex justify-end">
              {canWrite && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={`Modifier le tarif de ${f.nom}`}
                  onClick={() => onEdit(f)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Screen                                                          */
/* ------------------------------------------------------------------ */

export function FournisseursScreen() {
  const { go } = useNav();
  const { toast } = useToast();
  const canWrite = usePermission("fournisseurs:write");
  const fournisseurs = useStore((s) => s.fournisseurs);
  const dossierFournisseurs = useStore((s) => s.dossierFournisseurs);
  const dossiers = useStore((s) => s.dossiers);
  const removeFournisseur = useStore((s) => s.removeFournisseur);

  const [activeTab, setActiveTab] = React.useState<FournisseurTab>("prestataires");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<FournisseurType | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Fournisseur | undefined>();
  const { target: deleteTarget, setTarget: setDeleteTarget, confirm: handleDelete } = useDeleteConfirm<Fournisseur>(
    removeFournisseur,
    (f) => f.id,
    (f) => f.nom,
    "Fournisseur supprimé",
    "Impossible de supprimer le fournisseur.",
  );

  const filtered = React.useMemo(() => {
    return fournisseurs.filter((f) => {
      if (typeFilter && f.type !== typeFilter) return false;
      if (!matchesQuery(f, ["nom", "contact", "type"], search)) return false;
      return true;
    });
  }, [fournisseurs, search, typeFilter]);

  const tarifsSorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const at = a.tarifContractuel ?? -1;
        const bt = b.tarifContractuel ?? -1;
        if (bt !== at) return bt - at;
        return b.montantTotal - a.montantTotal;
      }),
    [filtered],
  );

  const totalMontant = React.useMemo(
    () => dossierFournisseurs.reduce((s, df) => s + df.montantReel, 0),
    [dossierFournisseurs],
  );
  const totalBudgete = React.useMemo(
    () => dossierFournisseurs.reduce((s, df) => s + df.montantBudgete, 0),
    [dossierFournisseurs],
  );
  const { actifs, avecTarif } = React.useMemo(() => {
    let actifs = 0;
    let avecTarif = 0;
    for (const f of fournisseurs) {
      if (f.statut === "Actif") actifs++;
      if (f.tarifContractuel != null) avecTarif++;
    }
    return { actifs, avecTarif };
  }, [fournisseurs]);
  const enAttente = React.useMemo(
    () => dossierFournisseurs.filter((df) => df.statut === "En attente").length,
    [dossierFournisseurs],
  );

  const liaisonsEnrichies = React.useMemo(() => {
    return dossierFournisseurs
      .filter((df) => {
        if (typeFilter && df.type !== typeFilter) return false;
        if (!matchesQuery(df, ["fournisseurNom", "dossierRef", "description"], search)) return false;
        return true;
      })
      .map((df) => ({
        ...df,
        dossier: dossiers.find((d) => d.id === df.dossierId),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [dossierFournisseurs, dossiers, search, typeFilter]);

  const counts: Record<FournisseurTab, number> = {
    prestataires: filtered.length,
    tarifs: tarifsSorted.length,
    couts: liaisonsEnrichies.length,
  };

  const currentMeta = TAB_META.find((t) => t.key === activeTab) ?? TAB_META[0];

  const chips: FilterChip[] = TYPES.map((t) => ({
    id: t,
    label: TYPE_META[t].short,
    active: typeFilter === t,
    onToggle: () => setTypeFilter((cur) => (cur === t ? null : t)),
  }));

  function handleEdit(f: Fournisseur) {
    setEditing(f);
    setShowForm(true);
  }

  const emptyCta = canWrite ? (
    <Button
      size="sm"
      onClick={() => {
        setEditing(undefined);
        setShowForm(true);
      }}
    >
      <Plus className="size-4" />
      Nouveau fournisseur
    </Button>
  ) : undefined;

  return (
    <div className="space-y-5">
      <PageHeader title="Fournisseurs" description={currentMeta.description}>
        {canWrite && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setShowForm(true);
            }}
          >
            <Plus className="size-4" />
            Nouveau fournisseur
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard compact label="Fournisseurs actifs" value={String(actifs)} icon={Building2} tone="blue" />
        <KpiCard
          compact
          label="Total sous-traité"
          value={formatFCFA(totalMontant)}
          icon={TrendingDown}
          tone="red"
        />
        <KpiCard
          compact
          label="Budget alloué"
          value={formatFCFA(totalBudgete)}
          icon={TrendingUp}
          tone="indigo"
        />
        <KpiCard
          compact
          label={activeTab === "tarifs" ? "Avec tarif défini" : "Paiements en attente"}
          value={activeTab === "tarifs" ? String(avecTarif) : String(enAttente)}
          icon={activeTab === "tarifs" ? Banknote : AlertCircle}
          tone="amber"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FournisseurTab)}
        className="space-y-4"
      >
        <MetaTabsList items={TAB_META} counts={counts} gridClassName="grid-cols-1 sm:grid-cols-3" />

        <ListFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            activeTab === "couts"
              ? "Rechercher une liaison, un dossier…"
              : "Rechercher un prestataire…"
          }
          chips={chips}
          activeCount={typeFilter ? 1 : 0}
          onClear={() => setTypeFilter(null)}
        />

        <TabsContent value="prestataires" className="mt-0 space-y-4">
          <PrestatairesTable
            items={filtered}
            canWrite={canWrite}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteTarget(fournisseurs.find((f) => f.id === id) ?? null)}
            emptyAction={emptyCta}
          />
        </TabsContent>

        <TabsContent value="tarifs" className="mt-0 space-y-4">
          <TarifsTable
            items={tarifsSorted}
            canWrite={canWrite}
            onEdit={handleEdit}
            emptyAction={emptyCta}
          />
        </TabsContent>

        <TabsContent value="couts" className="mt-0 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Liaisons dossiers
              </h2>
              <Badge variant="secondary" className="text-[10px]">
                {liaisonsEnrichies.length} prestation
                {liaisonsEnrichies.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {liaisonsEnrichies.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="Aucune liaison dossier"
                description="Les prestations rattachées aux dossiers apparaîtront ici pour le suivi budgétaire."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <>
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:px-5">
                  <span>Prestataire / Dossier</span>
                  <span className="hidden sm:block">Description</span>
                  <span className="text-right">Budgété</span>
                  <span className="text-right">Réel</span>
                  <span className="hidden sm:block">Écart</span>
                  <span>Statut</span>
                </div>
                {liaisonsEnrichies.map((df) => {
                  const ecart = df.montantReel - df.montantBudgete;
                  const m = TYPE_META[df.type];
                  const Icon = m.icon;
                  return (
                    <div
                      key={df.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            "hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex",
                            m.bg,
                          )}
                        >
                          <Icon className={cn("size-4", m.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                            {df.fournisseurNom}
                          </p>
                          <button
                            type="button"
                            onClick={() => go("dossier-detail", { id: df.dossierId })}
                            className="truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {df.dossierRef ?? df.dossierId} · {formatDateShort(df.date)}
                          </button>
                        </div>
                      </div>
                      <p className="hidden max-w-[160px] truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                        {df.description}
                      </p>
                      <p className="text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">
                        {formatFCFA(df.montantBudgete)}
                      </p>
                      <p className="text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        {formatFCFA(df.montantReel)}
                      </p>
                      <p
                        className={cn(
                          "hidden text-sm font-semibold tabular-nums sm:block",
                          ecart > 0
                            ? "text-red-600 dark:text-red-400"
                            : ecart < 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500",
                        )}
                      >
                        {ecart > 0 ? "+" : ""}
                        {formatFCFA(ecart)}
                      </p>
                      <DossierFournisseurStatutBadge statut={df.statut} />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <FournisseurModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(undefined);
        }}
        editing={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title="Supprimer ce fournisseur ?"
        description={
          <>
            <strong>{deleteTarget?.nom}</strong> sera
            définitivement supprimé, ainsi que toutes ses liaisons budget/réel sur les dossiers
            associés (historique perdu).
          </>
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
