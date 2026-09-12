"use client";

import { useMemo, useState } from "react";
import { usePagination } from "@/shared/hooks/use-pagination";
import {
  Plus,
  FileSignature,
  Wallet,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";

import { useStore, type Contrat, type ContratInput, type ContratStatut } from "@/lib/store";
import { useAppNavigation } from "@/lib/app-navigation";
import { formatFCFA, formatDateShort, parseAmount } from "@/lib/format";
import { matchesQuery } from "@/lib/search-filter";
import { usePermission } from "@/shared/hooks/use-permission";
import { useDeleteConfirm } from "@/shared/hooks/use-delete-confirm";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSlttBrand } from "@/lib/societe-brand";
import { printContrat } from "@/features/contrats/services/contrat-print";

import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge } from "@/components/sltt/status-badge";
import { ListFilters, type FilterChip } from "@/components/sltt/list-filters";
import { QuickClientButton } from "@/features/clients";
import { TablePagination } from "@/components/sltt/table-pagination";
import { EmptyState } from "@/components/sltt/empty-state";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import {
  CONTRAT_STATUTS,
  CONTRAT_STATUT_TONE,
  ContratFormModal as ContratEditModal,
} from "./contrat-detail";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";

import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const PAGE_SIZE = 8;

export function ContratsScreen() {
  const { toast } = useToast();
  const { goToContrat } = useAppNavigation();

  const contrats = useStore((s) => s.contrats);
  const clients = useStore((s) => s.clients);
  const depenses = useStore((s) => s.depenses);
  const contratPrestations = useStore((s) => s.contratPrestations);
  const societes = useStore((s) => s.societes);
  const addContrat = useStore((s) => s.addContrat);
  const updateContrat = useStore((s) => s.updateContrat);
  const removeContrat = useStore((s) => s.removeContrat);
  const { selectedAnnexeId } = useActiveAnnexe();
  const canWrite = usePermission("contrats:write");

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<ContratStatut | "all">("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [creatingContrat, setCreatingContrat] = useState(false);
  const [editContrat, setEditContrat] = useState<Contrat | null>(null);
  const { target: deleteTarget, setTarget: setDeleteTarget, confirm: handleDelete } = useDeleteConfirm<Contrat>(
    removeContrat, (c) => c.id, (c) => c.reference, "Contrat supprimé", "Impossible de supprimer le contrat",
  );

  // handleCreate ne réarme plus `creatingContrat` après un succès (le dialog
  // Radix reste monté et cliquable ~200ms pendant sa fermeture — un second
  // clic dans cette fenêtre resoumettait le même formulaire et créait un
  // contrat en double). On le réarme donc ici à chaque ouverture, dans le
  // handler qui déclenche l'ouverture (pas un useEffect sur `open` : un
  // setState synchrone dans un effet déclenche un rendu en cascade évitable).
  function openCreateDialog() {
    setCreatingContrat(false);
    setOpen(true);
  }

  const scoped = useMemo(
    () => filterByAnnexe(contrats, selectedAnnexeId),
    [contrats, selectedAnnexeId],
  );

  const stats = useMemo(() => {
    const actifs = scoped.filter((c) => c.statut === "Actif").length;
    const montantTotal = scoped.reduce((sum, c) => sum + c.montant, 0);
    const nbPrestations = scoped.reduce((sum, c) => sum + c.nbPrestations, 0);
    const nbRealisees = scoped.reduce((sum, c) => sum + c.nbPrestationsRealisees, 0);
    const totalDepenses = scoped.reduce((sum, c) => sum + c.totalDepenses, 0);
    return { actifs, montantTotal, nbPrestations, nbRealisees, totalDepenses };
  }, [scoped]);

  const filtered = useMemo(() => {
    return scoped.filter((c) => {
      if (!matchesQuery(c, ["reference", "objet", "clientNom"], search)) return false;
      if (statutFilter !== "all" && c.statut !== statutFilter) return false;
      if (clientFilter !== "all" && c.clientId !== clientFilter) return false;
      return true;
    });
  }, [scoped, search, statutFilter, clientFilter]);

  const { totalPages, safePage, paged, startIdx, endIdx } = usePagination(filtered, page, PAGE_SIZE);

  const chips: FilterChip[] = CONTRAT_STATUTS.map((s) => ({
    id: s,
    label: s,
    active: statutFilter === s,
    onToggle: () => {
      setStatutFilter((prev) => (prev === s ? "all" : s));
      setPage(1);
    },
  }));

  const activeCount = (statutFilter !== "all" ? 1 : 0) + (clientFilter !== "all" ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setStatutFilter("all");
    setClientFilter("all");
    setPage(1);
  }

  async function handleCreate(input: ContratInput) {
    if (creatingContrat) return;
    setCreatingContrat(true);
    try {
      const contrat = await addContrat(input);
      toastSuccess(toast, { title: "Contrat créé", description: `${contrat.reference} — ${input.clientNom}` });
      setOpen(false);
    } catch (e) {
      toastError(toast, e, { title: "Impossible de créer le contrat", fallback: "Impossible de créer le contrat." });
      setCreatingContrat(false);
    }
  }

  async function handleUpdateContrat(input: ContratInput) {
    if (!editContrat) return;
    try {
      await updateContrat(editContrat.id, input);
      toastSuccess(toast, { title: "Contrat modifié", description: editContrat.reference });
      setEditContrat(null);
    } catch (e) {
      toastError(toast, e, { title: "Impossible de modifier le contrat", fallback: UI.errors.saveFailed });
    }
  }

  function handlePrintContrat(c: Contrat) {
    const client = clients.find((cl) => cl.id === c.clientId);
    const prestations = contratPrestations
      .filter((p) => p.contratId === c.id)
      .map((p) => ({ libelle: p.libelle, description: p.description, montant: p.montant, statut: p.statut }));
    const contratDepenses = depenses
      .filter((d) => d.contratId === c.id)
      .map((d) => ({
        libelle: d.libelle,
        montant: d.montant,
        dateDepense: d.dateDepense,
        modePaiement: d.modePaiement,
      }));
    printContrat(
      {
        reference: c.reference,
        clientNom: c.clientNom,
        clientAdresse: client?.adresse,
        clientTelephone: client?.telephone,
        clientEmail: client?.email,
        objet: c.objet,
        dateDebut: c.dateDebut,
        dateFin: c.dateFin,
        montant: c.montant,
        statut: c.statut,
        notes: c.notes,
        prestations,
        depenses: contratDepenses,
        totalDepenses: c.totalDepenses,
      },
      resolveSlttBrand(societes),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Contrats" description="Contrats d'entreposage, dépenses et prestations optionnelles">
        {canWrite && (
          <Button
            onClick={openCreateDialog}
            className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all"
          >
            <Plus className="size-4" />
            Nouveau contrat
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Contrats actifs" value={String(stats.actifs)} icon={FileSignature} tone="blue" sublabel={`sur ${scoped.length} au total`} />
        <KpiCard label="Montant contractualisé" value={formatFCFA(stats.montantTotal)} icon={Wallet} tone="indigo" />
        <KpiCard
          label="Prestations réalisées"
          value={`${stats.nbRealisees}/${stats.nbPrestations}`}
          icon={CheckCircle2}
          tone="emerald"
          sublabel="prestations optionnelles"
        />
        <KpiCard label="Dépenses totales" value={formatFCFA(stats.totalDepenses)} icon={ClipboardCheck} tone="amber" />
      </div>

      <ListFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Référence, objet, client…"
        chips={chips}
        activeCount={activeCount}
        onClear={clearFilters}
        advanced={
          <>
            <Select
              value={clientFilter}
              onValueChange={(v) => {
                setClientFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Filtrer par client">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <Card className="gap-0 overflow-hidden rounded-2xl border border-border/70 p-0 shadow-xs bg-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title={scoped.length === 0 ? UI.empty.contrats.zero.title : UI.empty.contrats.filtered.title}
            description={scoped.length === 0 ? UI.empty.contrats.zero.description : UI.empty.contrats.filtered.description}
            primaryAction={
              canWrite && scoped.length === 0
                ? { label: UI.empty.contrats.zero.action, onClick: openCreateDialog, icon: Plus }
                : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((c) => (
                <Card
                  key={c.id}
                  className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
                  onClick={() => goToContrat(c.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-foreground">{c.reference}</p>
                      <p className="mt-1 truncate text-sm font-medium text-foreground/90">{c.clientNom}</p>
                    </div>
                    <ToneBadge tone={CONTRAT_STATUT_TONE[c.statut]}>{c.statut}</ToneBadge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Montant</dt>
                      <dd className="tabular-nums font-medium text-foreground">{formatFCFA(c.montant)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Prestations</dt>
                      <dd className="tabular-nums text-foreground/90">
                        {c.nbPrestationsRealisees}/{c.nbPrestations}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Début</dt>
                      <dd className="tabular-nums text-foreground/90">{formatDateShort(c.dateDebut)}</dd>
                    </div>
                  </dl>
                  <div
                    className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Voir" onClick={() => goToContrat(c.id)}>
                      <Eye className="size-4" />
                    </Button>
                    {canWrite && (
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Modifier" onClick={() => setEditContrat(c)}>
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Imprimer le contrat" onClick={() => handlePrintContrat(c)}>
                      <FileText className="size-4" />
                    </Button>
                    {canWrite && (
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600" title="Supprimer" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table aria-label="Liste des contrats">
                <TableHeader>
                  <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/50">
                    <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Référence</TableHead>
                    <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client</TableHead>
                    <TableHead className="hidden h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Objet</TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Montant</TableHead>
                    <TableHead className="h-10 px-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prestations</TableHead>
                    <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                    <TableHead className="h-10 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer border-b border-border hover:bg-muted/60"
                      onClick={() => goToContrat(c.id)}
                    >
                      <TableCell className="px-4 py-3.5">
                        <p className="font-mono text-xs font-medium text-foreground">{c.reference}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Début {formatDateShort(c.dateDebut)}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[160px] px-4 py-3.5">
                        <p className="truncate font-medium text-foreground/90">{c.clientNom}</p>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] px-4 py-3.5 md:table-cell">
                        <p className="truncate text-sm text-muted-foreground">{c.objet}</p>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-foreground sm:table-cell">
                        {formatFCFA(c.montant)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center tabular-nums text-muted-foreground">
                        {c.nbPrestationsRealisees}/{c.nbPrestations}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <ToneBadge tone={CONTRAT_STATUT_TONE[c.statut]}>{c.statut}</ToneBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Voir" onClick={() => goToContrat(c.id)}>
                            <Eye className="size-4" />
                          </Button>
                          {canWrite && (
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Modifier" onClick={() => setEditContrat(c)}>
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary" title="Imprimer le contrat" onClick={() => handlePrintContrat(c)}>
                            <FileText className="size-4" />
                          </Button>
                          {canWrite && (
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600" title="Supprimer" onClick={() => setDeleteTarget(c)}>
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`contrat${filtered.length !== 1 ? "s" : ""}`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <ContratFormModal
        open={open}
        onOpenChange={setOpen}
        saving={creatingContrat}
        onSubmit={handleCreate}
      />

      {editContrat && (
        <ContratEditModal
          open={!!editContrat}
          onOpenChange={(v) => !v && setEditContrat(null)}
          initial={{
            clientId: editContrat.clientId,
            clientNom: editContrat.clientNom,
            annexeId: editContrat.annexeId,
            objet: editContrat.objet,
            dateDebut: editContrat.dateDebut,
            dateFin: editContrat.dateFin,
            montant: editContrat.montant,
            statut: editContrat.statut,
            notes: editContrat.notes,
          }}
          onSubmit={handleUpdateContrat}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Supprimer ce contrat ?"
        description={<>Le contrat {deleteTarget?.reference} sera définitivement supprimé. Cette action est irréversible.</>}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function ContratFormModal({
  open,
  onOpenChange,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving?: boolean;
  onSubmit: (input: ContratInput) => void;
}) {
  const clients = useStore((s) => s.clients);
  const { annexes, activeAnnexeId } = useActiveAnnexe();

  const [annexeId, setAnnexeId] = useState(activeAnnexeId ?? "");
  const [clientId, setClientId] = useState("");
  const [objet, setObjet] = useState("");
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10));
  const [dateFin, setDateFin] = useState("");
  const [montant, setMontant] = useState("");
  const [statut, setStatut] = useState<ContratStatut>("Actif");
  const [notes, setNotes] = useState("");

  const showAnnexe = annexes.length > 1;
  const resolvedAnnexeId = showAnnexe ? annexeId : (activeAnnexeId ?? "");

  function resetForm() {
    setAnnexeId(activeAnnexeId ?? "");
    setClientId("");
    setObjet("");
    setDateDebut(new Date().toISOString().slice(0, 10));
    setDateFin("");
    setMontant("");
    setStatut("Actif");
    setNotes("");
  }

  const selectedClient = clients.find((c) => c.id === clientId);
  const dateFinValide = !dateFin || dateFin >= dateDebut;
  const canSubmit = Boolean(
    clientId &&
      objet.trim() &&
      dateFinValide &&
      (!showAnnexe || annexeId),
  );

  function handleSubmit() {
    if (!selectedClient || !canSubmit) return;
    onSubmit({
      clientId,
      clientNom: selectedClient.nom,
      annexeId: resolvedAnnexeId || undefined,
      objet: objet.trim(),
      dateDebut,
      dateFin: dateFin || undefined,
      montant: parseAmount(montant),
      statut,
      notes: notes.trim() || undefined,
    });
    resetForm();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouveau contrat</DialogTitle>
          <DialogDescription>Renseignez le client et l&apos;objet du contrat d&apos;entreposage.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {showAnnexe && (
            <div className="space-y-2">
              <Label>Annexe <span className="text-red-500">*</span></Label>
              <Select value={annexeId} onValueChange={setAnnexeId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une annexe" />
                </SelectTrigger>
                <SelectContent>
                  {annexes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Client <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <QuickClientButton onCreated={setClientId} />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Objet <span className="text-red-500">*</span></Label>
            <Textarea value={objet} onChange={(e) => setObjet(e.target.value)} rows={2} placeholder="Ex : Entreposage de marchandises diverses" />
          </div>

          <div className="space-y-2">
            <Label>Date de début</Label>
            <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Date de fin</Label>
            <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-10" />
            {!dateFinValide && (
              <p className="text-xs text-red-600 dark:text-red-400">La date de fin doit être postérieure à la date de début.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Montant</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder={UI.placeholders.amountFCFA}
                className="h-10 pr-16"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                FCFA
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={statut} onValueChange={(v) => setStatut(v as ContratStatut)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRAT_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all"
          >
            <Plus className="size-4" />
            Créer le contrat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
