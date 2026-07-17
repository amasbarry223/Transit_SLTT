"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, FileText, FileSpreadsheet, Pencil, Trash2,
  Truck, FolderKanban, Package,
  Phone, Mail, MapPin, ArrowUpDown, MoreHorizontal, PowerOff,
  Power, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";

import { useStore } from "@/lib/store";
import type { Transporteur, TransporteurInput, TransporteurStatut } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { exportToCSV, printHTML, htmlEscape } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { matchesQuery } from "@/lib/search-filter";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ActifStatutBadge } from "@/components/sltt/status-badge";
import {
  TransporteurFormFields,
  TransporteurFormStepper,
  VEHICULES,
  TRANSPORTEUR_FORM_STEPS,
  emptyTransporteurForm,
  isTransporteurFormValid,
  isTransporteurStepValid,
  maxReachableStep,
  validateTransporteurForm,
  validateTransporteurStep,
  firstInvalidTransporteurStep,
} from "@/components/sltt/transporteur-form-fields";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
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
/* Form modal                                                           */
/* ------------------------------------------------------------------ */

function TransporteurFormModal({
  open, mode, target, onClose,
}: {
  open: boolean;
  mode: "add" | "edit";
  target?: Transporteur;
  onClose: () => void;
}) {
  const addTransporteur    = useStore((s) => s.addTransporteur);
  const updateTransporteur = useStore((s) => s.updateTransporteur);
  const { toast }          = useToast();

  const isEdit = mode === "edit";
  const openKey = open ? (target?.id ?? "new") : null;
  const lastStep = TRANSPORTEUR_FORM_STEPS.length - 1;

  const [form, setForm] = useState<TransporteurInput>(emptyTransporteurForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TransporteurInput, string>>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      setForm(target ? {
        nom: target.nom,
        contact: target.contact,
        telephone: target.telephone,
        email: target.email ?? "",
        vehicule: target.vehicule,
        immatriculation: target.immatriculation,
        trajet: target.trajet,
        capacite: target.capacite,
        statut: target.statut,
        notes: target.notes ?? "",
      } : emptyTransporteurForm());
      setErrors({});
      setSaving(false);
      setStep(0);
    }
  }

  const valid = isTransporteurFormValid(form);
  const stepValid = isTransporteurStepValid(step, form);
  const completedThrough = maxReachableStep(form);
  const isLastStep = step === lastStep;

  const handleChange = (patch: Partial<TransporteurInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof TransporteurInput)[]) {
        delete next[key];
      }
      return next;
    });
  };

  const goToStep = (next: number) => {
    setStep(Math.max(0, Math.min(lastStep, next)));
    setErrors({});
  };

  const handleNext = () => {
    const stepErrors = validateTransporteurStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    goToStep(step + 1);
  };

  const handleBack = () => goToStep(step - 1);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const nextErrors = validateTransporteurForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStep(firstInvalidTransporteurStep(form));
      return;
    }
    setSaving(true);
    try {
      if (isEdit && target) {
        await updateTransporteur(target.id, form);
        toast({ title: "Transporteur modifié", description: form.nom });
      } else {
        const t = await addTransporteur(form);
        toast({ title: "Transporteur créé", description: t.nom });
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Impossible d'enregistrer le transporteur";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-0 border-b border-border/60 px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Truck className="size-5" />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <DialogTitle className="text-lg">
                {isEdit ? "Modifier le transporteur" : "Nouveau transporteur"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEdit
                  ? `Mettez à jour les informations de ${target?.nom ?? "ce partenaire"}.`
                  : "Ajoutez un transporteur ou chauffeur partenaire à l'annuaire SLTT."}
              </DialogDescription>
              {isEdit && target && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {target.vehicule}
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{target.immatriculation}</span>
                  {target.nbDossiers > 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      · {target.nbDossiers} dossier{target.nbDossiers > 1 ? "s" : ""} traité{target.nbDossiers > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <TransporteurFormStepper
              currentStep={step}
              completedThrough={completedThrough}
              onStepClick={goToStep}
            />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-[320px] overflow-y-auto px-6 py-5">
            <TransporteurFormFields
              values={form}
              onChange={handleChange}
              errors={errors}
              step={step}
              autoFocusNom={!isEdit && step === 0}
            />
          </div>

          <DialogFooter className="flex-col gap-3 border-t border-border/60 bg-slate-50/60 px-6 py-4 dark:bg-slate-800/40 sm:flex-row sm:justify-between">
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="text-slate-500">
                Annuler
              </Button>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {step + 1}/{TRANSPORTEUR_FORM_STEPS.length}
              </span>
            </div>

            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
                  <ChevronLeft className="size-4" />
                  Précédent
                </Button>
              )}
              {!isLastStep ? (
                <Button type="button" onClick={handleNext} disabled={!stepValid || saving}>
                  Suivant
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={!valid || saving}>
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : isEdit ? (
                    "Enregistrer les modifications"
                  ) : (
                    "Créer le transporteur"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                          */
/* ------------------------------------------------------------------ */

export function TransporteursScreen() {
  const { toast }                   = useToast();
  const canWrite                    = usePermission("transporteurs:write");
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
  const { target: deleteTarget, setTarget: setDeleteTarget, confirm: confirmDeleteTransporteur } = useDeleteConfirm<Transporteur>(
    removeTransporteur,
    (t) => t.id,
    (t) => t.nom,
    "Transporteur supprimé",
    "Impossible de supprimer le transporteur",
  );

  /* ---- KPIs ---- */
  const { actifs, inactifs, totalDossiers, capaciteTotal } = useMemo(() => {
    let actifs = 0;
    let inactifs = 0;
    let totalDossiers = 0;
    let capaciteTotal = 0;
    for (const t of transporteurs) {
      if (t.statut === "Actif") {
        actifs++;
        capaciteTotal += t.capacite;
      } else {
        inactifs++;
      }
      totalDossiers += t.nbDossiers;
    }
    return { actifs, inactifs, totalDossiers, capaciteTotal };
  }, [transporteurs]);

  /* ---- Filtered & sorted ---- */
  const filtered = useMemo(() => {
    const list = transporteurs.filter((t) => {
      if (!matchesQuery(t, ["nom", "contact", "trajet", "immatriculation"], search)) return false;
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

  const handleToggleStatut = async (t: Transporteur) => {
    const next: TransporteurStatut = t.statut === "Actif" ? "Inactif" : "Actif";
    try {
      await updateTransporteurStatut(t.id, next);
      toast({ title: `Transporteur ${next === "Actif" ? "activé" : "désactivé"}`, description: t.nom });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de modifier le statut", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast({
        title: "Rien à exporter",
        description: "Aucun transporteur ne correspond aux filtres actuels.",
        variant: "destructive",
      });
      return;
    }
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
    ], filtered, { module: "Transporteurs" });
    toast({ title: "Export Excel généré", description: `${filtered.length} transporteur${filtered.length !== 1 ? "s" : ""} exporté${filtered.length !== 1 ? "s" : ""}.` });
  };

  const handleExportPDF = () => {
    const rowsHTML = filtered.map((t) => `
      <tr>
        <td>${htmlEscape(t.nom)}</td>
        <td>${htmlEscape(t.contact)}<br><small>${htmlEscape(t.telephone)}</small></td>
        <td>${htmlEscape(t.vehicule)}<br><small style="font-family:monospace">${htmlEscape(t.immatriculation)}</small></td>
        <td>${htmlEscape(t.trajet)}</td>
        <td class="num">${t.capacite} t</td>
        <td class="num">${t.nbDossiers}</td>
        <td><span class="badge" style="${t.statut === "Actif" ? "background:#d1fae5;color:#065f46" : "background:#f1f5f9;color:#64748b"}">${htmlEscape(t.statut)}</span></td>
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
        {canWrite && (
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
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3">
          <Truck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
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

      {/* Filters */}
      <Card className="border-border/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
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
                  <ArrowUpDown className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                  <SelectValue placeholder="Trier par…" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-10 gap-1.5 text-slate-500 dark:text-slate-400" onClick={clearFilters}>
                  Réinitialiser
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
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
                  onClick={handleExportCSV} disabled={filtered.length === 0} title="Exporter Excel">
                  <FileSpreadsheet className="size-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Truck className="size-4 text-slate-400 dark:text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Liste des transporteurs</h2>
              <span className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {!isLoaded ? (
              <TransporteursTableSkeleton />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                  <Truck className="size-7" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Aucun transporteur trouvé</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {hasActiveFilters
                    ? "Modifiez vos filtres ou ajoutez un nouveau partenaire."
                    : "Commencez par enregistrer votre premier transporteur partenaire."}
                </p>
                {!hasActiveFilters && canWrite && (
                  <Button className="mt-5" onClick={() => setInlineForm({ mode: "add" })}>
                    <Plus className="size-4" /> Nouveau transporteur
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {paged.map((t) => {
                    const isInactif = t.statut === "Inactif";
                    return (
                      <Card
                        key={t.id}
                        className={cn(
                          "border-border/80 p-4 shadow-sm",
                          canWrite && "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/60",
                          isInactif && "opacity-80",
                        )}
                        onClick={canWrite ? () => { setInlineForm({ mode: "edit", target: t }); setDeleteTarget(null); } : undefined}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{t.nom}</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.contact}</p>
                          </div>
                          <ActifStatutBadge statut={t.statut} />
                        </div>
                        <dl className="mt-3 space-y-1.5 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Véhicule</dt>
                            <dd className="text-right text-slate-700 dark:text-slate-300">
                              {t.vehicule} <span className="font-mono text-xs text-slate-500">{t.immatriculation}</span>
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Téléphone</dt>
                            <dd className="font-mono text-xs text-slate-700 dark:text-slate-300">{t.telephone}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Trajet</dt>
                            <dd className="truncate text-right text-slate-700 dark:text-slate-300">{t.trajet}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Capacité / Dossiers</dt>
                            <dd className="tabular-nums text-slate-700 dark:text-slate-300">{t.capacite} t · {t.nbDossiers}</dd>
                          </div>
                        </dl>
                        {canWrite && (
                          <div
                            className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatut(t)}
                            >
                              {t.statut === "Actif" ? "Désactiver" : "Activer"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 dark:text-slate-400 hover:text-primary"
                              title="Modifier"
                              onClick={() => { setInlineForm({ mode: "edit", target: t }); setDeleteTarget(null); }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 dark:text-slate-400 hover:text-destructive"
                              title="Supprimer"
                              onClick={() => { setDeleteTarget(t); setInlineForm(null); }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Société / Contact</TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">Coordonnées</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Véhicule</TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">Trajet</TableHead>
                        <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">Capacité</TableHead>
                        <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">Dossiers</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Statut</TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((t) => {
                        const isInactif = t.statut === "Inactif";
                        return (
                          <TableRow
                            key={t.id}
                            className={cn(
                              "cursor-pointer border-b border-border transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80",
                              isInactif && "bg-slate-50/40 dark:bg-slate-800/40 opacity-80",
                              !canWrite && "cursor-default",
                            )}
                            onClick={canWrite ? () => { setInlineForm({ mode: "edit", target: t }); setDeleteTarget(null); } : undefined}
                          >
                            <TableCell className="px-4 py-3.5">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{t.nom}</p>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.contact}</p>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                <Phone className="size-3 shrink-0 text-slate-400 dark:text-slate-500" /> {t.telephone}
                              </div>
                              {t.email && (
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                  <Mail className="size-3 shrink-0" /> {t.email}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.vehicule}</p>
                              <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{t.immatriculation}</p>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 md:table-cell">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                <MapPin className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                                <span className="line-clamp-1">{t.trajet}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 text-right tabular-nums lg:table-cell">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{t.capacite} t</span>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 text-right tabular-nums lg:table-cell">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{t.nbDossiers}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <div className="flex flex-col gap-1">
                                <ActifStatutBadge statut={t.statut} />
                                {canWrite && (
                                  <button
                                    className={cn(
                                      "inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80",
                                      t.statut === "Actif" ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700",
                                    )}
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatut(t); }}
                                  >
                                    {t.statut === "Actif" ? "→ Désactiver" : "→ Activer"}
                                  </button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {canWrite && (
                                  <>
                                    <Button variant="ghost" size="icon" className="size-8 text-slate-500 dark:text-slate-400 hover:text-primary"
                                      title="Modifier"
                                      onClick={() => { setInlineForm({ mode: "edit", target: t }); setDeleteTarget(null); }}>
                                      <Pencil className="size-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8 text-slate-500 dark:text-slate-400 hover:text-primary">
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => handleToggleStatut(t)}>
                                          {t.statut === "Actif"
                                            ? <><PowerOff className="mr-2 size-3.5" /> Désactiver</>
                                            : <><Power className="mr-2 size-3.5 text-emerald-600 dark:text-emerald-400" /> Activer</>}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:bg-red-950/40 focus:text-red-700"
                                          onClick={() => { setDeleteTarget(t); setInlineForm(null); }}
                                        >
                                          <Trash2 className="mr-2 size-3.5" /> Supprimer
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
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

      {/* Form modal */}
      {inlineForm && (
        <TransporteurFormModal
          key={inlineForm.target?.id ?? "new"}
          open
          mode={inlineForm.mode}
          target={inlineForm.target}
          onClose={() => setInlineForm(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Supprimer ce transporteur ?"
        description={
          <>
            <strong>{deleteTarget?.nom}</strong>
            {deleteTarget && ` (${deleteTarget.vehicule} · ${deleteTarget.trajet})`} sera
            définitivement retiré de l'annuaire. Les dossiers associés ne seront pas affectés.
          </>
        }
        onConfirm={confirmDeleteTransporteur}
      />
    </div>
  );
}
