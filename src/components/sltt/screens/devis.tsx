"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  FileSpreadsheet,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  FileOutput,
  ClipboardList,
  ArrowUpDown,
  Eye,
  FolderKanban,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { Devis, DevisInput, DevisStatut } from "@/lib/store";
import { formatFCFA, formatDateShort, parseAmount } from "@/lib/format";
import { exportToCSV, printHTML, printInvoice } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Constants & types                                                   */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 8;

const STATUT_CONFIG: Record<
  DevisStatut,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string; dot: string }
> = {
  Brouillon: { label: "Brouillon", icon: Clock,        className: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  Envoyé:    { label: "Envoyé",    icon: Send,         className: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
  Accepté:   { label: "Accepté",   icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Refusé:    { label: "Refusé",    icon: XCircle,      className: "bg-red-50 text-red-600 border-red-200",        dot: "bg-red-500" },
  Expiré:    { label: "Expiré",    icon: AlertCircle,  className: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400" },
};

const NEXT_STATUT: Partial<Record<DevisStatut, { to: DevisStatut; label: string; colorClass: string; bgClass: string }>> = {
  Brouillon: { to: "Envoyé",  label: "→ Envoyer",   colorClass: "text-blue-700",    bgClass: "bg-blue-50" },
  Envoyé:    { to: "Accepté", label: "→ Accepter",  colorClass: "text-emerald-700", bgClass: "bg-emerald-50" },
};

type SortKey = "date-desc" | "date-asc" | "reference" | "client" | "montant-desc" | "montant-asc" | "validite-asc" | "statut";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc",    label: "Date (récent d'abord)" },
  { value: "date-asc",     label: "Date (ancien d'abord)" },
  { value: "reference",    label: "Référence A → Z" },
  { value: "client",       label: "Client A → Z" },
  { value: "montant-desc", label: "Montant (décroissant)" },
  { value: "montant-asc",  label: "Montant (croissant)" },
  { value: "validite-asc", label: "Validité (proche d'abord)" },
  { value: "statut",       label: "Statut" },
];

/* ------------------------------------------------------------------ */
/* Statut badge                                                        */
/* ------------------------------------------------------------------ */

function DevisStatutBadge({ statut }: { statut: DevisStatut }) {
  const cfg = STATUT_CONFIG[statut];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
      <Icon className="size-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function DevisTableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="hidden h-4 w-32 md:block" />
          <Skeleton className="hidden h-4 w-24 lg:block" />
          <Skeleton className="ml-auto h-5 w-16 rounded-full" />
          <Skeleton className="h-7 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

function TablePagination({
  startIdx, endIdx, totalItems, itemLabel, page, totalPages, onPageChange,
}: {
  startIdx: number; endIdx: number; totalItems: number; itemLabel: string;
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs tabular-nums text-slate-500">
        {startIdx}–{endIdx} sur {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9" disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-slate-600">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" className="h-9" disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form dialog                                                         */
/* ------------------------------------------------------------------ */

interface DevisFormProps {
  open: boolean;
  devis: Devis | null;
  clients: { id: string; nom: string }[];
  onClose: () => void;
  onSave: (input: DevisInput) => void;
}

function DevisFormDialog({ open, devis, clients, onClose, onSave }: DevisFormProps) {
  const [clientId, setClientId] = useState(devis?.clientId ?? "");
  const [clientNom, setClientNom] = useState(devis?.clientNom ?? "");
  const [nature, setNature] = useState(devis?.nature ?? "");
  const [droitDouane, setDroitDouane] = useState(devis ? String(devis.droitDouane) : "");
  const [fraisCircuit, setFraisCircuit] = useState(devis ? String(devis.fraisCircuit) : "");
  const [fraisPrestation, setFraisPrestation] = useState(devis ? String(devis.fraisPrestation) : "");
  const [dateValidite, setDateValidite] = useState(devis?.dateValidite ?? "");
  const [notes, setNotes] = useState(devis?.notes ?? "");
  const isEdit = devis !== null;

  useEffect(() => {
    if (open) {
      setClientId(devis?.clientId ?? "");
      setClientNom(devis?.clientNom ?? "");
      setNature(devis?.nature ?? "");
      setDroitDouane(devis ? String(devis.droitDouane) : "");
      setFraisCircuit(devis ? String(devis.fraisCircuit) : "");
      setFraisPrestation(devis ? String(devis.fraisPrestation) : "");
      setDateValidite(devis?.dateValidite ?? "");
      setNotes(devis?.notes ?? "");
    }
  }, [open, devis]);

  const dd = parseAmount(droitDouane);
  const fc = parseAmount(fraisCircuit);
  const fp = parseAmount(fraisPrestation);
  const total = dd + fc + fp;
  const valid = !!clientId && !!nature.trim() && !!dateValidite;

  function handleClientChange(id: string) {
    setClientId(id);
    const c = clients.find((c) => c.id === id);
    if (c) setClientNom(c.nom);
  }

  function handleSave() {
    if (!valid) return;
    onSave({ clientId, clientNom, nature, droitDouane: dd, fraisCircuit: fc, fraisPrestation: fp, dateValidite, notes: notes.trim() || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le devis" : "Nouveau devis"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations du devis." : "Créez un devis client avant d'ouvrir un dossier."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Client <span className="text-red-500">*</span></Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger>
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
            <Label>Nature de la marchandise <span className="text-red-500">*</span></Label>
            <Input value={nature} onChange={(e) => setNature(e.target.value)} placeholder="ex. Matériaux de construction" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Droits douane (FCFA)</Label>
              <Input value={droitDouane} onChange={(e) => setDroitDouane(e.target.value)} placeholder="0" className="text-right tabular-nums" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Frais circuit (FCFA)</Label>
              <Input value={fraisCircuit} onChange={(e) => setFraisCircuit(e.target.value)} placeholder="0" className="text-right tabular-nums" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Prestation SLTT (FCFA)</Label>
              <Input value={fraisPrestation} onChange={(e) => setFraisPrestation(e.target.value)} placeholder="0" className="text-right tabular-nums" />
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-blue-700">Total estimé</span>
              <span className="font-bold tabular-nums text-blue-900">{formatFCFA(total)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date de validité <span className="text-red-500">*</span></Label>
              <Input type="date" value={dateValidite} onChange={(e) => setDateValidite(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (facultatif)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, remarques..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={!valid}>
            {isEdit ? "Enregistrer" : "Créer le devis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                         */
/* ------------------------------------------------------------------ */

export function DevisScreen() {
  const { toast } = useToast();
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const openDevisDetail = useNav((s) => s.openDevisDetail);

  const devisList = useStore((s) => s.devis);
  const clients = useStore((s) => s.clients);
  const addDevis = useStore((s) => s.addDevis);
  const updateDevis = useStore((s) => s.updateDevis);
  const updateDevisStatut = useStore((s) => s.updateDevisStatut);
  const convertDevisToDossier = useStore((s) => s.convertDevisToDossier);
  const removeDevis = useStore((s) => s.removeDevis);

  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState<DevisStatut | "Tous">("Tous");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editDevis, setEditDevis] = useState<Devis | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);

  function handleOpenDevis(d: Devis) {
    openDevisDetail(d.id, false);
  }

  function handleOpenEdit(d: Devis) {
    openDevisDetail(d.id, true);
  }

  /* ---- KPIs ---- */
  const totalDevis = devisList.length;
  const enAttente = devisList.filter((d) => d.statut === "Envoyé").length;
  const acceptes = devisList.filter((d) => d.statut === "Accepté").length;
  const totalEstime = devisList
    .filter((d) => d.statut !== "Refusé" && d.statut !== "Expiré")
    .reduce((s, d) => s + d.total, 0);

  /* ---- Filters ---- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = devisList.filter((d) => {
      if (q && !`${d.reference} ${d.clientNom} ${d.nature}`.toLowerCase().includes(q)) return false;
      if (clientFilter !== "all" && d.clientId !== clientFilter) return false;
      if (statutFilter !== "Tous" && d.statut !== statutFilter) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":    return b.dateCreation.localeCompare(a.dateCreation);
        case "date-asc":     return a.dateCreation.localeCompare(b.dateCreation);
        case "reference":    return a.reference.localeCompare(b.reference);
        case "client":       return a.clientNom.localeCompare(b.clientNom, "fr");
        case "montant-desc": return b.total - a.total;
        case "montant-asc":  return a.total - b.total;
        case "validite-asc": return a.dateValidite.localeCompare(b.dateValidite);
        case "statut":       return a.statut.localeCompare(b.statut);
        default: return 0;
      }
    });
  }, [devisList, search, clientFilter, statutFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const activeFiltersCount = [search.trim() !== "", clientFilter !== "all", statutFilter !== "Tous"].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;

  function clearFilters() {
    setSearch("");
    setClientFilter("all");
    setStatutFilter("Tous");
    setSortBy("date-desc");
    setPage(1);
  }

  /* ---- Actions ---- */
  function handleSaveForm(input: DevisInput) {
    if (editDevis) {
      updateDevis(editDevis.id, input);
      toast({ title: "Devis modifié", description: editDevis.reference });
    } else {
      const d = addDevis(input);
      toast({ title: "Devis créé", description: d.reference });
    }
    setFormOpen(false);
    setEditDevis(null);
  }

  function handleQuickStatut(d: Devis, toStatut: DevisStatut) {
    updateDevisStatut(d.id, toStatut);
    toast({ title: "Statut mis à jour", description: `${d.reference} → ${toStatut}` });
  }

  function handleDelete() {
    const d = devisList.find((x) => x.id === deleteId);
    if (!d) return;
    removeDevis(d.id);
    toast({ title: "Devis supprimé", description: d.reference });
    setDeleteId(null);
  }

  function handleConvert() {
    const d = devisList.find((x) => x.id === convertId);
    if (!d) return;
    const dossier = convertDevisToDossier(d.id);
    if (dossier) {
      toast({ title: "Dossier créé", description: `${dossier.reference} ouvert depuis ${d.reference}` });
      openDossierDetail(dossier.id);
    }
    setConvertId(null);
  }

  function handlePrintDevis(d: Devis) {
    const client = clients.find((c) => c.id === d.clientId);
    printInvoice({
      reference: d.reference,
      clientNom: d.clientNom,
      clientAdresse: client?.adresse,
      clientTelephone: client?.telephone,
      clientEmail: client?.email,
      nature: d.nature,
      date: d.dateCreation,
      droitDouane: d.droitDouane,
      fraisCircuit: d.fraisCircuit,
      fraisPrestation: d.fraisPrestation,
      montantInvesti: d.total,
      montantPaye: 0,
    }, d.reference);
  }

  function handleExportCSV() {
    exportToCSV(
      `devis-sltt-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "Référence",       accessor: (d: Devis) => d.reference },
        { header: "Client",          accessor: (d: Devis) => d.clientNom },
        { header: "Nature",          accessor: (d: Devis) => d.nature },
        { header: "Droits douane",   accessor: (d: Devis) => d.droitDouane },
        { header: "Frais circuit",   accessor: (d: Devis) => d.fraisCircuit },
        { header: "Prestation SLTT", accessor: (d: Devis) => d.fraisPrestation },
        { header: "Total estimé",    accessor: (d: Devis) => d.total },
        { header: "Date création",   accessor: (d: Devis) => formatDateShort(d.dateCreation) },
        { header: "Date validité",   accessor: (d: Devis) => formatDateShort(d.dateValidite) },
        { header: "Statut",          accessor: (d: Devis) => d.statut },
      ],
      filtered,
    );
    toast({ title: "Export CSV généré", description: `${filtered.length} devis exportés.` });
  }

  function handleExportPDF() {
    const rowsHTML = filtered.map((d) => `
      <tr>
        <td>${d.reference}</td>
        <td>${d.clientNom}</td>
        <td>${d.nature}</td>
        <td class="num">${formatFCFA(d.total, false)}</td>
        <td>${formatDateShort(d.dateValidite)}</td>
        <td><span class="badge" style="background:#dbeafe;color:#1e3a8a">${d.statut}</span></td>
      </tr>`).join("");
    printHTML("Liste des devis", `
      <h1>Devis SLTT</h1>
      <div class="subtitle">${filtered.length} devis · ${formatDateShort(new Date())}</div>
      <table>
        <thead><tr>
          <th>Référence</th><th>Client</th><th>Nature</th>
          <th class="num">Total estimé</th><th>Validité</th><th>Statut</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>`);
  }

  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Devis" description="Estimations tarifaires avant ouverture de dossier">
        <Button onClick={() => { setEditDevis(null); setFormOpen(true); }}>
          <Plus className="size-4" />
          Nouveau devis
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total devis"          value={String(totalDevis)}       icon={ClipboardList} tone="blue"    sublabel="devis enregistrés" />
        <KpiCard label="En attente de réponse" value={String(enAttente)}       icon={Send}          tone="amber"   sublabel="envoyés, sans retour" />
        <KpiCard label="Acceptés"              value={String(acceptes)}        icon={CheckCircle2}  tone="emerald" sublabel="convertibles en dossier" />
        <KpiCard label="Montant estimé actif"  value={formatFCFA(totalEstime)} icon={FileOutput}    tone="indigo"  sublabel="hors refusés et expirés" />
      </div>

      {/* Banner */}
      {enAttente > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/60 px-4 py-3">
          <Send className="mt-0.5 size-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {enAttente} devis{enAttente > 1 ? "" : ""} en attente de réponse client
            </p>
            <p className="mt-0.5 text-xs text-blue-800/80">
              Relancez vos clients ou passez directement au statut Accepté pour créer le dossier.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 pl-9"
              placeholder="Référence, client, nature…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-full sm:w-52">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v as DevisStatut | "Tous"); setPage(1); }}>
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les statuts</SelectItem>
              {(["Brouillon", "Envoyé", "Accepté", "Refusé", "Expiré"] as DevisStatut[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortKey); setPage(1); }}>
            <SelectTrigger className="h-10 w-full sm:w-52">
              <ArrowUpDown className="size-3.5 shrink-0 text-slate-400" />
              <SelectValue placeholder="Trier par…" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
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
          <ClipboardList className="size-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Liste des devis</h2>
          <span className="ml-auto text-xs tabular-nums text-slate-500">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {!isLoaded ? (
          <DevisTableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ClipboardList className="size-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun devis trouvé</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau devis."
                : "Commencez par créer votre premier devis client."}
            </p>
            {!hasActiveFilters && (
              <Button className="mt-5" onClick={() => { setEditDevis(null); setFormOpen(true); }}>
                <Plus className="size-4" />
                Nouveau devis
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Référence
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Client
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                      Nature marchandise
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Total estimé
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">
                      Validité
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Statut
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((d) => {
                    const next = NEXT_STATUT[d.statut];
                    const isEnAttente = d.statut === "Envoyé";
                    return (
                      <TableRow
                        key={d.id}
                        className={cn(
                          "cursor-pointer border-b border-border transition-colors hover:bg-slate-50/80",
                          isEnAttente && "bg-blue-50/30",
                        )}
                        onClick={() => handleOpenDevis(d)}
                      >
                        <TableCell className="px-4 py-3.5">
                          <p className="font-mono text-xs font-semibold text-slate-900">{d.reference}</p>
                          <p className="mt-0.5 text-xs tabular-nums text-slate-400">{formatDateShort(d.dateCreation)}</p>
                        </TableCell>

                        <TableCell className="max-w-[180px] px-4 py-3.5">
                          <p className="truncate font-medium text-slate-700">{d.clientNom}</p>
                        </TableCell>

                        <TableCell className="hidden max-w-[200px] px-4 py-3.5 md:table-cell">
                          <span className="line-clamp-1 text-sm text-slate-600">{d.nature}</span>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-right">
                          <span className="font-semibold tabular-nums text-slate-900">{formatFCFA(d.total)}</span>
                        </TableCell>

                        <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                          <span className="text-sm tabular-nums text-slate-500">{formatDateShort(d.dateValidite)}</span>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <DevisStatutBadge statut={d.statut} />
                            {next && (
                              <button
                                className={cn(
                                  "inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80",
                                  next.bgClass, next.colorClass,
                                )}
                                onClick={(e) => { e.stopPropagation(); handleQuickStatut(d, next.to); }}
                              >
                                {next.label}
                              </button>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-primary"
                              title="Voir" onClick={() => handleOpenDevis(d)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-primary"
                              title="Modifier" onClick={() => handleOpenEdit(d)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-primary">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => handleOpenDevis(d)}>
                                  <ExternalLink className="mr-2 size-3.5" /> Ouvrir la fiche
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrintDevis(d)}>
                                  <FileText className="mr-2 size-3.5" /> Imprimer le devis
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {d.statut !== "Accepté" && (
                                  <DropdownMenuItem
                                    className="text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800"
                                    onClick={() => setConvertId(d.id)}
                                  >
                                    <FolderKanban className="mr-2 size-3.5" /> Convertir en dossier
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                  onClick={() => setDeleteId(d.id)}
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
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`devis`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* Dialogs */}
      <DevisFormDialog
        open={formOpen}
        devis={editDevis}
        clients={clients}
        onClose={() => { setFormOpen(false); setEditDevis(null); }}
        onSave={handleSaveForm}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis {devisList.find((x) => x.id === deleteId)?.reference} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!convertId} onOpenChange={(o) => !o && setConvertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en dossier de transit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un nouveau dossier sera créé à partir du devis {devisList.find((x) => x.id === convertId)?.reference}.
              Le devis passera au statut <strong>Accepté</strong> et vous serez redirigé vers la fiche dossier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              Créer le dossier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
