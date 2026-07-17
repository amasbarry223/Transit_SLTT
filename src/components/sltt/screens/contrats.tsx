"use client";

import { useMemo, useState } from "react";
import { usePagination } from "@/hooks/use-pagination";
import {
  Plus,
  FileSignature,
  Wallet,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";

import { useStore, type ContratInput, type ContratStatut } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { useAppNavigation } from "@/lib/app-navigation";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { matchesQuery } from "@/lib/search-filter";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";

import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge } from "@/components/sltt/status-badge";
import { SocieteBadge, SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import { ListFilters, type FilterChip } from "@/components/sltt/list-filters";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
import { TablePagination } from "@/components/sltt/table-pagination";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 8;

const STATUT_TONE: Record<ContratStatut, "emerald" | "slate" | "amber"> = {
  Actif: "emerald",
  Clôturé: "slate",
  Suspendu: "amber",
};

const STATUTS: ContratStatut[] = ["Actif", "Clôturé", "Suspendu"];

export function ContratsScreen() {
  const { toast } = useToast();
  const { goToContrat } = useAppNavigation();

  const contrats = useStore((s) => s.contrats);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const addContrat = useStore((s) => s.addContrat);
  const selectedSocieteId = useNav((s) => s.selectedSocieteId);
  const canWrite = usePermission("contrats:write");

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<ContratStatut | "all">("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const scoped = useMemo(
    () =>
      selectedSocieteId
        ? contrats.filter((c) => c.societeId === selectedSocieteId)
        : contrats,
    [contrats, selectedSocieteId],
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

  const chips: FilterChip[] = STATUTS.map((s) => ({
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
    try {
      const contrat = await addContrat(input);
      toast({ title: "Contrat créé", description: `${contrat.reference} — ${input.clientNom}` });
      setOpen(false);
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Impossible de créer le contrat.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Contrats" description="Contrats d'entreposage, dépenses et prestations optionnelles">
        {canWrite && (
          <Button onClick={() => setOpen(true)}>
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
            <SocieteFilterSelect className="w-full sm:w-44" />
          </>
        }
      />

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <FileSignature className="size-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Aucun contrat trouvé</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {activeCount > 0 || search
                ? "Modifiez vos filtres ou créez un nouveau contrat."
                : "Créez votre premier contrat d'entreposage."}
            </p>
            {canWrite && activeCount === 0 && !search && (
              <Button className="mt-5" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                Nouveau contrat
              </Button>
            )}
          </div>
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
                      <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{c.reference}</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{c.clientNom}</p>
                    </div>
                    <ToneBadge tone={STATUT_TONE[c.statut]}>{c.statut}</ToneBadge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Société</dt>
                      <dd><SocieteBadge societeNom={c.societeNom} size="sm" /></dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Montant</dt>
                      <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatFCFA(c.montant)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Prestations</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                        {c.nbPrestationsRealisees}/{c.nbPrestations}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Début</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(c.dateDebut)}</dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table aria-label="Liste des contrats">
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Référence</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Société</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Client</TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">Objet</TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">Montant</TableHead>
                    <TableHead className="h-10 px-4 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Prestations</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                      onClick={() => goToContrat(c.id)}
                    >
                      <TableCell className="px-4 py-3.5">
                        <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{c.reference}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Début {formatDateShort(c.dateDebut)}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <SocieteBadge societeNom={c.societeNom} size="sm" />
                      </TableCell>
                      <TableCell className="max-w-[160px] px-4 py-3.5">
                        <p className="truncate font-medium text-slate-700 dark:text-slate-300">{c.clientNom}</p>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] px-4 py-3.5 md:table-cell">
                        <p className="truncate text-sm text-slate-600 dark:text-slate-300">{c.objet}</p>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100 sm:table-cell">
                        {formatFCFA(c.montant)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
                        {c.nbPrestationsRealisees}/{c.nbPrestations}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <ToneBadge tone={STATUT_TONE[c.statut]}>{c.statut}</ToneBadge>
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
        defaultSocieteId={selectedSocieteId ?? societes[0]?.id}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function ContratFormModal({
  open,
  onOpenChange,
  defaultSocieteId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSocieteId?: string;
  onSubmit: (input: ContratInput) => void;
}) {
  const societes = useStore((s) => s.societes);
  const clients = useStore((s) => s.clients);

  const [societeId, setSocieteId] = useState(defaultSocieteId ?? "");
  const [clientId, setClientId] = useState("");
  const [objet, setObjet] = useState("");
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10));
  const [dateFin, setDateFin] = useState("");
  const [montant, setMontant] = useState("");
  const [statut, setStatut] = useState<ContratStatut>("Actif");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setSocieteId(defaultSocieteId ?? "");
    setClientId("");
    setObjet("");
    setDateDebut(new Date().toISOString().slice(0, 10));
    setDateFin("");
    setMontant("");
    setStatut("Actif");
    setNotes("");
  }

  const selectedClient = clients.find((c) => c.id === clientId);
  const canSubmit = Boolean(societeId && clientId && objet.trim());

  function handleSubmit() {
    if (!selectedClient || !canSubmit) return;
    onSubmit({
      societeId,
      clientId,
      clientNom: selectedClient.nom,
      objet: objet.trim(),
      dateDebut,
      dateFin: dateFin || undefined,
      montant: Number(montant) || 0,
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
          <DialogDescription>Renseignez la société, le client et l'objet du contrat d'entreposage.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Société <span className="text-red-500">*</span></Label>
            <Select value={societeId} onValueChange={setSocieteId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Sélectionner une société" />
              </SelectTrigger>
              <SelectContent>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          </div>

          <div className="space-y-2">
            <Label>Montant</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0"
                className="h-10 pr-16"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500">
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
                {STATUTS.map((s) => (
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
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            <Plus className="size-4" />
            Créer le contrat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
