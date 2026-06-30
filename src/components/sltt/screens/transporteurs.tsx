"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, FileText, FileSpreadsheet, Pencil, Trash2,
  Truck, FolderKanban, Package,
  Phone, Mail, MapPin, ArrowUpDown, MoreHorizontal, PowerOff,
  Power, X, Save, AlertTriangle, CheckCircle2, ArrowLeft,
} from "lucide-react";

import { useStore } from "@/lib/store";
import type { Transporteur, TransporteurInput, TransporteurStatut, TypeVehicule } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { exportToCSV, printHTML } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 8;
const VEHICULES: TypeVehicule[] = ["Camion", "Remorque", "Semi-remorque", "Benne", "Fourgon"];

type SortKey = "date-desc" | "date-asc" | "nom" | "trajet" | "capacite-desc" | "capacite-asc" | "dossiers-desc" | "statut";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc",     label: "Date d'ajout (récent)" },
  { value: "date-asc",      label: "Date d'ajout (ancien)" },
  { value: "nom",           label: "Nom A → Z" },
  { value: "trajet",        label: "Trajet A → Z" },
  { value: "capacite-desc", label: "Capacité (décroissante)" },
  { value: "capacite-asc",  label: "Capacité (croissante)" },
  { value: "dossiers-desc", label: "Dossiers traités" },
  { value: "statut",        label: "Statut" },
];

/* ------------------------------------------------------------------ */
/* Statut badge                                                         */
/* ------------------------------------------------------------------ */

function StatutBadge({ statut }: { statut: TransporteurStatut }) {
  return statut === "Actif" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-500" /> Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      <span className="size-1.5 rounded-full bg-slate-400" /> Inactif
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                             */
/* ------------------------------------------------------------------ */

function TransporteursTableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="ml-auto h-5 w-14 rounded-full" />
          <Skeleton className="h-7 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                           */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Inline form (replaces the Dialog modal)                              */
/* ------------------------------------------------------------------ */

const EMPTY_FORM: TransporteurInput = {
  nom: "", contact: "", telephone: "", email: "",
  vehicule: "Camion", immatriculation: "", trajet: "",
  capacite: 10, statut: "Actif", notes: "",
};

function FormField({ id, label, req, error, children }: {
  id?: string; label: string; req?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {req && <span className="text-red-500 normal-case">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function InlineTransporteurForm({
  mode, target, onClose,
}: {
  mode: "add" | "edit";
  target?: Transporteur;
  onClose: () => void;
}) {
  const addTransporteur    = useStore((s) => s.addTransporteur);
  const updateTransporteur = useStore((s) => s.updateTransporteur);
  const { toast }          = useToast();

  const [form, setForm] = useState<TransporteurInput>(() => target ? {
    nom: target.nom, contact: target.contact,
    telephone: target.telephone, email: target.email ?? "",
    vehicule: target.vehicule, immatriculation: target.immatriculation,
    trajet: target.trajet, capacite: target.capacite,
    statut: target.statut, notes: target.notes ?? "",
  } : EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = mode === "edit";

  const setField = (field: keyof TransporteurInput, value: string | number | TransporteurStatut | TypeVehicule) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nom.trim())             e.nom = "Nom requis";
    if (!form.contact.trim())         e.contact = "Contact requis";
    if (!form.telephone.trim())       e.telephone = "Téléphone requis";
    if (!form.immatriculation.trim()) e.immatriculation = "Immatriculation requise";
    if (!form.trajet.trim())          e.trajet = "Trajet requis";
    if (!form.capacite || form.capacite <= 0) e.capacite = "Capacité invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isEdit && target) {
      updateTransporteur(target.id, form);
      toast({ title: "Transporteur modifié", description: form.nom });
    } else {
      const t = addTransporteur(form);
      toast({ title: "Transporteur créé", description: t.nom });
    }
    onClose();
  };

  return (
    <Card className="border-blue-200 shadow-md overflow-hidden">
      {/* Form header */}
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-700">
              <Truck className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-blue-900">
                {isEdit ? "Modifier le transporteur" : "Nouveau transporteur"}
              </h2>
              <p className="text-xs text-blue-700/70">
                {isEdit ? target?.nom : "Enregistrez un nouveau partenaire logistique"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-blue-400 hover:bg-blue-200/50 hover:text-blue-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Form fields */}
      <div className="p-6 space-y-6">
        {/* Section identité */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Identité</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="nom" label="Société / Nom" req error={errors.nom}>
              <Input id="nom" value={form.nom}
                onChange={(e) => setField("nom", e.target.value)}
                placeholder="Konaté Transport SARL"
                className={cn("h-10", errors.nom && "border-red-400")} />
            </FormField>
            <FormField id="contact" label="Nom du contact" req error={errors.contact}>
              <Input id="contact" value={form.contact}
                onChange={(e) => setField("contact", e.target.value)}
                placeholder="Mamadou Konaté"
                className={cn("h-10", errors.contact && "border-red-400")} />
            </FormField>
          </div>
        </div>

        {/* Section coordonnées */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Coordonnées</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tel" label="Téléphone" req error={errors.telephone}>
              <Input id="tel" value={form.telephone}
                onChange={(e) => setField("telephone", e.target.value)}
                placeholder="+223 76 00 00 00"
                className={cn("h-10", errors.telephone && "border-red-400")} />
            </FormField>
            <FormField id="email" label="Email">
              <Input id="email" type="email" value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="transport@mail.ml" className="h-10" />
            </FormField>
          </div>
        </div>

        {/* Section véhicule */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Véhicule & capacité</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Type de véhicule" req>
              <Select value={form.vehicule} onValueChange={(v) => setField("vehicule", v as TypeVehicule)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VEHICULES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="immat" label="Immatriculation" req error={errors.immatriculation}>
              <Input id="immat" value={form.immatriculation}
                onChange={(e) => setField("immatriculation", e.target.value.toUpperCase())}
                placeholder="BK-0001-ML"
                className={cn("h-10 font-mono", errors.immatriculation && "border-red-400")} />
            </FormField>
            <FormField id="trajet" label="Trajet habituel" req error={errors.trajet}>
              <Input id="trajet" value={form.trajet}
                onChange={(e) => setField("trajet", e.target.value)}
                placeholder="Bamako – Dakar"
                className={cn("h-10", errors.trajet && "border-red-400")} />
            </FormField>
            <FormField id="capacite" label="Capacité (t)" req error={errors.capacite}>
              <Input id="capacite" type="number" min={1} value={form.capacite}
                onChange={(e) => setField("capacite", Number(e.target.value))}
                className={cn("h-10", errors.capacite && "border-red-400")} />
            </FormField>
          </div>
        </div>

        {/* Statut + Notes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-slate-50 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Transporteur actif</p>
              <p className="text-xs text-slate-500 mt-0.5">Disponible pour recevoir des missions</p>
            </div>
            <Switch
              checked={form.statut === "Actif"}
              onCheckedChange={(v) => setField("statut", v ? "Actif" : "Inactif")}
            />
          </div>
          <FormField id="notes" label="Notes">
            <Textarea id="notes" value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Informations complémentaires..."
              rows={2} className="resize-none" />
          </FormField>
        </div>
      </div>

      {/* Form footer */}
      <div className="flex items-center justify-between border-t border-border bg-slate-50/60 px-6 py-4">
        <Button variant="ghost" size="sm" className="text-slate-500" onClick={onClose}>
          <ArrowLeft className="mr-2 size-4" /> Retour à la liste
        </Button>
        <Button onClick={handleSubmit} className="gap-2 bg-blue-700 hover:bg-blue-800">
          <Save className="size-4" />
          {isEdit ? "Enregistrer les modifications" : "Créer le transporteur"}
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                          */
/* ------------------------------------------------------------------ */

export function TransporteursScreen() {
  const { toast }                   = useToast();
  const transporteurs               = useStore((s) => s.transporteurs);
  const updateTransporteurStatut    = useStore((s) => s.updateTransporteurStatut);
  const removeTransporteur          = useStore((s) => s.removeTransporteur);

  const [isLoaded, setIsLoaded]     = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Filters
  const [search,        setSearch]        = useState("");
  const [vehiculeFilter, setVehiculeFilter] = useState("all");
  const [statutFilter,  setStatutFilter]  = useState("Tous");
  const [sortBy,        setSortBy]        = useState<SortKey>("date-desc");
  const [page,          setPage]          = useState(1);

  // Inline form (replaces Dialog)
  const [inlineForm, setInlineForm] = useState<{ mode: "add" | "edit"; target?: Transporteur } | null>(null);

  // Delete confirmation (inline)
  const [deleteTarget, setDeleteTarget] = useState<Transporteur | null>(null);

  /* ---- KPIs ---- */
  const actifs        = transporteurs.filter((t) => t.statut === "Actif").length;
  const inactifs      = transporteurs.filter((t) => t.statut === "Inactif").length;
  const totalDossiers = transporteurs.reduce((s, t) => s + t.nbDossiers, 0);
  const capaciteTotal = transporteurs.filter((t) => t.statut === "Actif").reduce((s, t) => s + t.capacite, 0);

  /* ---- Filtered & sorted ---- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = transporteurs.filter((t) => {
      if (q && !`${t.nom} ${t.contact} ${t.trajet} ${t.immatriculation}`.toLowerCase().includes(q)) return false;
      if (vehiculeFilter !== "all" && t.vehicule !== vehiculeFilter) return false;
      if (statutFilter !== "Tous" && t.statut !== statutFilter) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":     return b.dateCreation.localeCompare(a.dateCreation);
        case "date-asc":      return a.dateCreation.localeCompare(b.dateCreation);
        case "nom":           return a.nom.localeCompare(b.nom, "fr");
        case "trajet":        return a.trajet.localeCompare(b.trajet, "fr");
        case "capacite-desc": return b.capacite - a.capacite;
        case "capacite-asc":  return a.capacite - b.capacite;
        case "dossiers-desc": return b.nbDossiers - a.nbDossiers;
        case "statut":        return a.statut.localeCompare(b.statut);
        default: return 0;
      }
    });
  }, [transporteurs, search, vehiculeFilter, statutFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx   = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx     = Math.min(safePage * PAGE_SIZE, filtered.length);

  const activeFiltersCount = [search.trim() !== "", vehiculeFilter !== "all", statutFilter !== "Tous"].filter(Boolean).length;
  const hasActiveFilters   = activeFiltersCount > 0;

  const clearFilters = () => {
    setSearch(""); setVehiculeFilter("all"); setStatutFilter("Tous");
    setSortBy("date-desc"); setPage(1);
  };

  const handleToggleStatut = (t: Transporteur) => {
    const next: TransporteurStatut = t.statut === "Actif" ? "Inactif" : "Actif";
    updateTransporteurStatut(t.id, next);
    toast({ title: `Transporteur ${next === "Actif" ? "activé" : "désactivé"}`, description: t.nom });
  };

  const handleDelete = (t: Transporteur) => {
    removeTransporteur(t.id);
    toast({ title: "Transporteur supprimé", description: t.nom });
    setDeleteTarget(null);
  };

  const handleExportCSV = () => {
    exportToCSV(`transporteurs-sltt-${new Date().toISOString().slice(0, 10)}`, [
      { header: "Société",         accessor: (t: Transporteur) => t.nom },
      { header: "Contact",         accessor: (t: Transporteur) => t.contact },
      { header: "Téléphone",       accessor: (t: Transporteur) => t.telephone },
      { header: "Email",           accessor: (t: Transporteur) => t.email ?? "" },
      { header: "Véhicule",        accessor: (t: Transporteur) => t.vehicule },
      { header: "Immatriculation", accessor: (t: Transporteur) => t.immatriculation },
      { header: "Trajet",          accessor: (t: Transporteur) => t.trajet },
      { header: "Capacité (t)",    accessor: (t: Transporteur) => t.capacite },
      { header: "Dossiers",        accessor: (t: Transporteur) => t.nbDossiers },
      { header: "Statut",          accessor: (t: Transporteur) => t.statut },
      { header: "Date ajout",      accessor: (t: Transporteur) => formatDateShort(t.dateCreation) },
    ], filtered);
    toast({ title: "Export CSV généré", description: `${filtered.length} transporteurs exportés.` });
  };

  const handleExportPDF = () => {
    const rowsHTML = filtered.map((t) => `
      <tr>
        <td>${t.nom}</td>
        <td>${t.contact}<br><small>${t.telephone}</small></td>
        <td>${t.vehicule}<br><small style="font-family:monospace">${t.immatriculation}</small></td>
        <td>${t.trajet}</td>
        <td class="num">${t.capacite} t</td>
        <td class="num">${t.nbDossiers}</td>
        <td><span class="badge" style="${t.statut === "Actif" ? "background:#d1fae5;color:#065f46" : "background:#f1f5f9;color:#64748b"}">${t.statut}</span></td>
      </tr>`).join("");
    printHTML("Liste des transporteurs", `
      <h1>Transporteurs partenaires</h1>
      <div class="subtitle">${filtered.length} transporteur(s) · ${formatDateShort(new Date())}</div>
      <table>
        <thead><tr>
          <th>Société</th><th>Contact</th><th>Véhicule</th>
          <th>Trajet</th><th class="num">Capacité</th><th class="num">Dossiers</th><th>Statut</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>`);
  };

  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <PageHeader title="Transporteurs" description="Annuaire des transporteurs et chauffeurs partenaires">
        {!inlineForm && (
          <Button onClick={() => { setInlineForm({ mode: "add" }); setDeleteTarget(null); }}>
            <Plus className="size-4" /> Nouveau transporteur
          </Button>
        )}
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Actifs"          value={String(actifs)}           icon={Truck}        tone="emerald" sublabel="disponibles pour missions" />
        <KpiCard label="Inactifs"        value={String(inactifs)}         icon={PowerOff}     tone="amber"   sublabel="en maintenance ou suspendus" />
        <KpiCard label="Dossiers traités" value={String(totalDossiers)}   icon={FolderKanban} tone="blue"    sublabel="au total sur tous partenaires" />
        <KpiCard label="Capacité totale" value={`${capaciteTotal} t`}     icon={Package}      tone="indigo"  sublabel="des transporteurs actifs" />
      </div>

      {/* Banner inactifs */}
      {inactifs > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
          <Truck className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {inactifs} transporteur{inactifs > 1 ? "s" : ""} inactif{inactifs > 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              Ces partenaires ne peuvent pas recevoir de nouvelles missions.
            </p>
          </div>
        </div>
      )}

      {/* ── Inline form (replaces filter+table when open) ── */}
      {inlineForm ? (
        <InlineTransporteurForm
          key={inlineForm.target?.id ?? "new"}
          mode={inlineForm.mode}
          target={inlineForm.target}
          onClose={() => setInlineForm(null)}
        />
      ) : (
        <>
          {/* Filters */}
          <Card className="border-border/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input className="h-10 pl-9" placeholder="Société, contact, trajet, immat…"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>

              <Select value={vehiculeFilter} onValueChange={(v) => { setVehiculeFilter(v); setPage(1); }}>
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <SelectValue placeholder="Véhicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les véhicules</SelectItem>
                  {VEHICULES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v); setPage(1); }}>
                <SelectTrigger className="h-10 w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">Tous les statuts</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortKey); setPage(1); }}>
                <SelectTrigger className="h-10 w-full sm:w-52">
                  <ArrowUpDown className="size-3.5 shrink-0 text-slate-400" />
                  <SelectValue placeholder="Trier par…" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-10 gap-1.5 text-slate-500" onClick={clearFilters}>
                  Réinitialiser
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                    {activeFiltersCount}
                  </span>
                </Button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-9 shrink-0"
                  onClick={handleExportPDF} disabled={filtered.length === 0} title="Exporter PDF">
                  <FileText className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-9 shrink-0"
                  onClick={handleExportCSV} disabled={filtered.length === 0} title="Exporter CSV">
                  <FileSpreadsheet className="size-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Truck className="size-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Liste des transporteurs</h2>
              <span className="ml-auto text-xs tabular-nums text-slate-500">
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {!isLoaded ? (
              <TransporteursTableSkeleton />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Truck className="size-7" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun transporteur trouvé</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {hasActiveFilters
                    ? "Modifiez vos filtres ou ajoutez un nouveau partenaire."
                    : "Commencez par enregistrer votre premier transporteur partenaire."}
                </p>
                {!hasActiveFilters && (
                  <Button className="mt-5" onClick={() => setInlineForm({ mode: "add" })}>
                    <Plus className="size-4" /> Nouveau transporteur
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50">
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">Société / Contact</TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">Coordonnées</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">Véhicule</TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">Trajet</TableHead>
                        <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">Capacité</TableHead>
                        <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">Dossiers</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">Statut</TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((t) => {
                        const isInactif = t.statut === "Inactif";
                        return (
                          <TableRow
                            key={t.id}
                            className={cn(
                              "cursor-pointer border-b border-border transition-colors hover:bg-slate-50/80",
                              isInactif && "bg-slate-50/40 opacity-80",
                            )}
                            onClick={() => { setInlineForm({ mode: "edit", target: t }); setDeleteTarget(null); }}
                          >
                            <TableCell className="px-4 py-3.5">
                              <p className="font-semibold text-slate-900">{t.nom}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{t.contact}</p>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Phone className="size-3 shrink-0 text-slate-400" /> {t.telephone}
                              </div>
                              {t.email && (
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                                  <Mail className="size-3 shrink-0" /> {t.email}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <p className="text-sm font-medium text-slate-700">{t.vehicule}</p>
                              <p className="mt-0.5 font-mono text-xs text-slate-500">{t.immatriculation}</p>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 md:table-cell">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                <MapPin className="size-3.5 shrink-0 text-slate-400" />
                                <span className="line-clamp-1">{t.trajet}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 text-right tabular-nums lg:table-cell">
                              <span className="font-medium text-slate-700">{t.capacite} t</span>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 text-right tabular-nums lg:table-cell">
                              <span className="font-semibold text-slate-700">{t.nbDossiers}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <div className="flex flex-col gap-1">
                                <StatutBadge statut={t.statut} />
                                <button
                                  className={cn(
                                    "inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80",
                                    t.statut === "Actif" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700",
                                  )}
                                  onClick={(e) => { e.stopPropagation(); handleToggleStatut(t); }}
                                >
                                  {t.statut === "Actif" ? "→ Désactiver" : "→ Activer"}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-primary"
                                  title="Modifier"
                                  onClick={() => { setInlineForm({ mode: "edit", target: t }); setDeleteTarget(null); }}>
                                  <Pencil className="size-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-primary">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleToggleStatut(t)}>
                                      {t.statut === "Actif"
                                        ? <><PowerOff className="mr-2 size-3.5" /> Désactiver</>
                                        : <><Power className="mr-2 size-3.5 text-emerald-600" /> Activer</>}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                      onClick={() => { setDeleteTarget(t); setInlineForm(null); }}
                                    >
                                      <Trash2 className="mr-2 size-3.5" /> Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  startIdx={startIdx} endIdx={endIdx} totalItems={filtered.length}
                  itemLabel={`transporteur${filtered.length !== 1 ? "s" : ""}`}
                  page={safePage} totalPages={totalPages} onPageChange={setPage}
                />
              </>
            )}
          </Card>
        </>
      )}

      {/* ── Delete confirmation — inline (no AlertDialog) ── */}
      {deleteTarget && !inlineForm && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/60 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 border border-red-200">
              <AlertTriangle className="size-6 text-red-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-red-900">Supprimer ce transporteur ?</h3>
              <p className="mt-1 text-sm text-red-800/80 leading-relaxed">
                <strong>{deleteTarget.nom}</strong> ({deleteTarget.vehicule} · {deleteTarget.trajet}) sera définitivement retiré de l'annuaire.
                Les dossiers associés ne seront pas affectés. Cette action est irréversible.
              </p>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Button size="sm" variant="destructive" className="gap-2"
                  onClick={() => handleDelete(deleteTarget)}>
                  <Trash2 className="size-4" /> Confirmer la suppression
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
