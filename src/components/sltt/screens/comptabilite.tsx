"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Wallet,
  Clock,
  TrendingUp,
  Banknote,
  ArrowLeftRight,
  Smartphone,
  CreditCard,
  HandCoins,
  Search,
  CircleCheck,
  Receipt,
  Info,
} from "lucide-react";
import { useStore, type Ecriture, type PaiementMode } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { EmptyState } from "@/components/sltt/empty-state";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EcritureStatutBadge, EcartValue } from "@/components/sltt/status-badge";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { filterBySocieteAndPeriode, computeBenefice } from "@/lib/benefice";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";

const PAGE_SIZE = 8;

/** Onglet spécial : écritures sans société assignée (dossiers de transit
 * classiques, sorties de caisse) — activité de la société mère SLTT. */
const SLTT_MERE_TAB = "__sltt_mere__";

type StatutFilter = "all" | "En attente" | "Soldé";

const modeIcon: Record<
  PaiementMode,
  React.ComponentType<{ className?: string }>
> = {
  Espèces: Banknote,
  Virement: ArrowLeftRight,
  "Mobile Money": Smartphone,
  Chèque: CreditCard,
};

const modeOptions: PaiementMode[] = [
  "Espèces",
  "Virement",
  "Mobile Money",
  "Chèque",
];


function deriveStatut(e: Ecriture): "Soldé" | "En attente" {
  const reste = Math.max(0, e.montantInvesti - e.montantPaye);
  return reste === 0 ? "Soldé" : "En attente";
}

export function ComptabiliteScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("comptabilite:write");
  const go = useNav((s) => s.go);
  const selectedId = useNav((s) => s.selectedId);
  const allEcritures = useStore((s) => s.ecritures);
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const societes = useStore((s) => s.societes);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);
  const recordPayment = useStore((s) => s.recordPayment);
  const addEcriture = useStore((s) => s.addEcriture);

  // Onglets : Toutes / une par société / société mère SLTT (écritures sans société).
  const [activeTab, setActiveTab] = useState<string>(SLTT_MERE_TAB);

  // Tri alphabétique simple — pas de liste de noms codée en dur à tenir à jour
  // si une société est renommée ou qu'une nouvelle est ajoutée.
  const sortedSocietes = useMemo(
    () => [...societes].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [societes],
  );

  const ecritures = useMemo(() => {
    if (activeTab === "all") return allEcritures;
    if (activeTab === SLTT_MERE_TAB) return allEcritures.filter((e) => !e.societeId);
    return allEcritures.filter((e) => e.societeId === activeTab);
  }, [allEcritures, activeTab]);

  const now = new Date();
  // F5 : le Bénéfice compte une écriture au mois où l'argent est réellement
  // arrivé (datePaiement), pas au mois de création de l'écriture — sinon un
  // paiement enregistré plus tard se retrouve compté dans le mauvais mois.
  const ecrituresAvecDate = useMemo(
    () => allEcritures.map((e) => ({ ...e, date: e.datePaiement ?? e.date })),
    [allEcritures],
  );
  const depensesAvecDate = useMemo(
    () => depenses.map((d) => ({ ...d, date: d.dateDepense })),
    [depenses],
  );
  // Sorties de caisse : sans société (au nom de la société mère), donc uniquement
  // comptées dans la vue consolidée "Toutes sociétés" (comme le transit).
  const caisseAvecDate = useMemo(
    () =>
      bonsSortieCaisse.flatMap((b) =>
        b.lignes.map((l) => ({ societeId: undefined as string | undefined, date: l.date, montant: l.montant })),
      ),
    [bonsSortieCaisse],
  );
  const benefice = useMemo(() => {
    const computeFor = (societeId: string | null) => {
      const recettes =
        filterBySocieteAndPeriode(ecrituresAvecDate, societeId, now.getFullYear(), now.getMonth()).reduce(
          (sum, e) => sum + e.montantPaye,
          0,
        ) +
        filterBySocieteAndPeriode(factures, societeId, now.getFullYear(), now.getMonth()).reduce(
          (sum, f) => sum + f.montantPaye,
          0,
        );
      const depensesMois =
        filterBySocieteAndPeriode(depensesAvecDate, societeId, now.getFullYear(), now.getMonth()).reduce(
          (sum, d) => sum + d.montant,
          0,
        ) +
        filterBySocieteAndPeriode(caisseAvecDate, societeId, now.getFullYear(), now.getMonth()).reduce(
          (sum, d) => sum + d.montant,
          0,
        );
      return { recettes, depenses: depensesMois, benefice: computeBenefice(recettes, depensesMois) };
    };
    return {
      consolide: computeFor(null),
      parSociete: societes.map((s) => ({ societe: s, ...computeFor(s.id) })),
    };
  }, [ecrituresAvecDate, factures, depensesAvecDate, caisseAvecDate, societes, now]);

  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Ecriture | null>(null);
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState<PaiementMode>("Virement");
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [neClientId, setNeClientId] = useState("");
  const [neDossierId, setNeDossierId] = useState("");
  const [neInvesti, setNeInvesti] = useState("");
  const [nePaye, setNePaye] = useState("");
  const [neMode, setNeMode] = useState<PaiementMode>("Virement");
  const [neDate, setNeDate] = useState(new Date().toISOString().slice(0, 10));
  const [neNote, setNeNote] = useState("");
  const [neSocieteId, setNeSocieteId] = useState<string>("");

  const clientDossiers = useMemo(
    () => (neClientId ? dossiers.filter((d) => d.clientId === neClientId) : []),
    [neClientId, dossiers],
  );

  const totalInvesti = useMemo(
    () => ecritures.reduce((s, e) => s + e.montantInvesti, 0),
    [ecritures],
  );
  const totalPaye = useMemo(
    () => ecritures.reduce((s, e) => s + e.montantPaye, 0),
    [ecritures],
  );
  const totalDu = totalInvesti - totalPaye;
  const enAttenteCount = useMemo(
    () => ecritures.filter((e) => deriveStatut(e) === "En attente").length,
    [ecritures],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ecritures.filter((e) => {
      if (clientFilter !== "all" && e.clientId !== clientFilter) return false;
      if (statutFilter !== "all" && deriveStatut(e) !== statutFilter) return false;
      if (q) {
        const haystack = `${e.clientNom} ${e.id} ${e.modePaiement} ${e.note ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [ecritures, query, statutFilter, clientFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    query.trim() !== "" || statutFilter !== "all" || clientFilter !== "all";

  function clearFilters() {
    setQuery("");
    setStatutFilter("all");
    setClientFilter("all");
    setPage(1);
  }

  function openPanel(e: Ecriture) {
    const reste = Math.max(0, e.montantInvesti - e.montantPaye);
    setSelected(e);
    setMontant(String(reste));
    setMode(e.modePaiement);
    setDatePaiement(new Date().toISOString().slice(0, 10));
    setNote(e.note ?? "");
    setOpen(true);
  }

  function valider() {
    if (!selected) return;
    const montantNum = Number(montant.replace(/\s/g, "")) || 0;
    const reste = Math.max(0, selected.montantInvesti - selected.montantPaye);
    if (montantNum <= 0) {
      toast({ title: "Montant invalide", description: "Le montant doit être supérieur à 0.", variant: "destructive" });
      return;
    }
    if (montantNum > reste) {
      toast({
        title: "Montant invalide",
        description: `Le paiement (${formatFCFA(montantNum)}) dépasse le reste à payer (${formatFCFA(reste)}).`,
        variant: "destructive",
      });
      return;
    }
    recordPayment(selected.id, montantNum, mode, datePaiement, note);
    toast({
      title: "Paiement enregistré",
      description: "Le solde du dossier a été mis à jour.",
    });
    setOpen(false);
    setSelected(null);
  }

  function resetNewEcriture() {
    setNeClientId("");
    setNeDossierId("");
    setNeInvesti("");
    setNePaye("");
    setNeMode("Virement");
    setNeDate(new Date().toISOString().slice(0, 10));
    setNeNote("");
    setNeSocieteId(activeTab !== "all" && activeTab !== SLTT_MERE_TAB ? activeTab : "");
  }

  useEffect(() => {
    if (selectedId === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le routeur (nav-store) : ouvre le dialogue puis consomme le marqueur "new" de l'URL
      resetNewEcriture();
      setNewOpen(true);
      go("comptabilite");
    }
  }, [selectedId, go]);

  function handleCreateEcriture() {
    if (!neClientId) {
      toast({
        title: "Client requis",
        description: "Veuillez sélectionner un client.",
        variant: "destructive",
      });
      return;
    }
    const client = clients.find((c) => c.id === neClientId);
    if (!client) return;
    const investi = Number(neInvesti.replace(/\s/g, "")) || 0;
    const paye = Number(nePaye.replace(/\s/g, "")) || 0;
    if (investi <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant investi doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }
    // UX-03: avertir si paye > investi (la valeur sera plafonnée)
    if (paye > investi) {
      toast({
        title: "Montant payé plafonné",
        description: `Le montant payé (${formatFCFA(paye)}) dépasse le montant investi (${formatFCFA(investi)}). Il a été ramené à ${formatFCFA(investi)}.`,
        variant: "destructive",
      });
    }
    addEcriture({
      date: neDate,
      clientId: neClientId,
      clientNom: client.nom,
      dossierId: neDossierId || undefined,
      societeId: neSocieteId || undefined,
      montantInvesti: investi,
      montantPaye: Math.min(paye, investi),
      modePaiement: neMode,
      note: neNote || undefined,
    });
    toast({
      title: "Écriture créée",
      description: `${client.nom} — ${formatFCFA(investi)} investi.`,
    });
    setNewOpen(false);
    resetNewEcriture();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptabilité"
        description="Suivi interne des paiements liés aux dossiers de transit"
      >
        {canWrite && (
          <Button
            onClick={() => {
              resetNewEcriture();
              setNewOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouvelle écriture
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10 flex-wrap">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          {sortedSocietes.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              Société {s.nom}
            </TabsTrigger>
          ))}
          <TabsTrigger value={SLTT_MERE_TAB} title="Société Traoré de Logistique, Transit et Transport">
            SLTT
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 px-4 py-3 text-xs text-blue-900 dark:text-blue-200">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
        <p>
          <strong>Où enregistrer un paiement ?</strong> Dossier transit → transition « Soldé » sur la fiche dossier ;
          facture client → module{" "}
          <button onClick={() => go("factures")} className="font-semibold underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-100">
            Factures
          </button>
          ; paiement autonome sans dossier → écriture ici. Les trois canaux sont indépendants.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total investi"
          value={formatFCFA(totalInvesti)}
          icon={TrendingUp}
          tone="blue"
          sublabel="cumul des dossiers"
        />
        <KpiCard
          label="Total encaissé"
          value={formatFCFA(totalPaye)}
          icon={Wallet}
          tone="emerald"
          sublabel="paiements reçus"
        />
        <KpiCard
          label="Total dû"
          value={formatFCFA(totalDu)}
          icon={Clock}
          tone="amber"
          sublabel={`${enAttenteCount} écriture${enAttenteCount !== 1 ? "s" : ""} en attente`}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bénéfice du mois (entreposage)</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Toutes sociétés"
            value={formatFCFA(benefice.consolide.benefice)}
            icon={TrendingUp}
            tone={benefice.consolide.benefice >= 0 ? "emerald" : "red"}
            sublabel="Recettes − Dépenses, consolidé"
            tooltip="Recettes = encaissements (écritures + paiements factures) du mois. Dépenses = dépenses de contrats du mois. Consolidé = somme des deux sociétés + activité non affectée."
          />
          {benefice.parSociete.map(({ societe, benefice: b }) => (
            <KpiCard
              key={societe.id}
              label={societe.nom}
              value={formatFCFA(b)}
              icon={TrendingUp}
              tone={b >= 0 ? "emerald" : "red"}
              sublabel="bénéfice du mois"
            />
          ))}
        </div>
      </div>

      {enAttenteCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {enAttenteCount} écriture{enAttenteCount > 1 ? "s" : ""} en attente
              de paiement
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              {formatFCFA(totalDu)} reste à encaisser au total.
            </p>
          </div>
        </div>
      )}

      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher client, référence…"
              className="h-10 pl-9"
              aria-label="Rechercher une écriture"
            />
          </div>

          <Select
            value={statutFilter}
            onValueChange={(v) => {
              setStatutFilter(v as StatutFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="Soldé">Soldé</SelectItem>
            </SelectContent>
          </Select>

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

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500 dark:text-slate-400"
              onClick={clearFilters}
            >
              Réinitialiser
            </Button>
          )}

          <p className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {filtered.length} écriture{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Receipt className="size-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Écritures comptables
          </h2>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aucune écriture trouvée"
            description={
              hasActiveFilters
                ? "Modifiez vos filtres ou créez une nouvelle écriture."
                : "Commencez par enregistrer votre première écriture comptable."
            }
            action={
              !hasActiveFilters && canWrite ? (
                <Button
                  onClick={() => {
                    resetNewEcriture();
                    setNewOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Nouvelle écriture
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Client
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Société
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Investi
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Payé
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Reste dû
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">
                      Écart de règlement
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Mode
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Statut
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((e) => {
                    const reste = Math.max(0, e.montantInvesti - e.montantPaye);
                    const ecart = e.montantPaye - e.montantInvesti;
                    const statut = deriveStatut(e);
                    const ModeIcon = modeIcon[e.modePaiement];
                    const solde = reste === 0;

                    return (
                      <TableRow
                        key={e.id}
                        className={cn(
                          "border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60",
                          !solde && "bg-amber-50/20 dark:bg-amber-950/20",
                        )}
                      >
                        <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                          {formatDateShort(e.date)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{e.clientNom}</p>
                          <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500 sm:hidden">
                            {e.id}
                          </p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                          <SocieteBadge societeNom={e.societeNom} size="sm" />
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 sm:table-cell">
                          {formatFCFA(e.montantInvesti)}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 md:table-cell">
                          {formatFCFA(e.montantPaye)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums">
                          {solde ? (
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              Soldé
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {formatFCFA(reste)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right lg:table-cell">
                          <EcartValue value={ecart} />
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 md:table-cell">
                          <span
                            className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
                            title={e.modePaiement}
                          >
                            <ModeIcon className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm">{e.modePaiement}</span>
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <EcritureStatutBadge statut={statut} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {solde ? (
                              <span
                                className="flex size-8 items-center justify-center text-emerald-500"
                                title="Écriture soldée"
                                aria-label="Écriture soldée"
                              >
                                <CircleCheck className="size-4" />
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-primary hover:bg-primary/10 hover:text-primary"
                                onClick={() => openPanel(e)}
                                aria-label={`Enregistrer un paiement pour ${e.clientNom}`}
                                title="Enregistrer un paiement"
                              >
                                <HandCoins className="size-4" />
                              </Button>
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
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`écriture${filtered.length !== 1 ? "s" : ""}`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            {selected && (
              <DialogDescription>
                {selected.clientNom} · {selected.id}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {selected && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Montant investi</span>
                  <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                    {formatFCFA(selected.montantInvesti)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Déjà payé</span>
                  <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatFCFA(selected.montantPaye)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Reste à payer</span>
                  <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatFCFA(
                      Math.max(
                        0,
                        selected.montantInvesti - selected.montantPaye,
                      ),
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="montant" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Montant
              </Label>
              <div className="relative">
                <Input
                  id="montant"
                  inputMode="numeric"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="h-10 pr-16 tabular-nums"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500">
                  FCFA
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Mode de paiement
              </Label>
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as PaiementMode)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modeOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Note
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Référence, acompte, complément d'information…"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={valider}>
              <Wallet className="size-4" />
              Valider le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle écriture comptable</DialogTitle>
            <DialogDescription>
              Sélectionnez un client et saisissez les montants investi et payé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ne-client" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Client <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={neClientId}
                  onValueChange={(v) => {
                    setNeClientId(v);
                    setNeDossierId("");
                  }}
                >
                  <SelectTrigger id="ne-client" className="h-10 w-full">
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
                <QuickClientButton
                  onCreated={(id) => {
                    setNeClientId(id);
                    setNeDossierId("");
                  }}
                />
              </div>
            </div>

            {clientDossiers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="ne-dossier" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dossier lié (optionnel)
                </Label>
                <Select
                  value={neDossierId}
                  onValueChange={(v) => {
                    setNeDossierId(v);
                    // LOGIC-10 (audit) : verrouiller le montant investi sur celui
                    // du dossier lié — sinon l'écriture et le dossier peuvent
                    // afficher deux "montants investis" différents pour la même
                    // opération.
                    const linked = clientDossiers.find((d) => d.id === v);
                    if (linked) setNeInvesti(String(linked.montantInvesti));
                  }}
                >
                  <SelectTrigger id="ne-dossier" className="h-10 w-full">
                    <SelectValue placeholder="Aucun dossier lié" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientDossiers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.reference} — {d.nature}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ne-investi" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Montant investi (FCFA) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ne-investi"
                  type="number"
                  value={neInvesti}
                  onChange={(e) => setNeInvesti(e.target.value)}
                  placeholder="0"
                  className="h-10"
                  disabled={!!neDossierId}
                />
                {neDossierId && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Verrouillé sur le montant investi du dossier lié.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ne-paye" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Montant payé (FCFA)
                </Label>
                <Input
                  id="ne-paye"
                  type="number"
                  value={nePaye}
                  onChange={(e) => setNePaye(e.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ne-mode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mode de paiement
                </Label>
                <Select
                  value={neMode}
                  onValueChange={(v) => setNeMode(v as PaiementMode)}
                >
                  <SelectTrigger id="ne-mode" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modeOptions.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ne-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date
                </Label>
                <Input
                  id="ne-date"
                  type="date"
                  value={neDate}
                  onChange={(e) => setNeDate(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Société (optionnel)
              </Label>
              <Select value={neSocieteId || "none"} onValueChange={(v) => setNeSocieteId(v === "none" ? "" : v)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Aucune (transit)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune (transit)</SelectItem>
                  {societes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ne-note" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Note
              </Label>
              <Textarea
                id="ne-note"
                value={neNote}
                onChange={(e) => setNeNote(e.target.value)}
                rows={3}
                placeholder="Référence, acompte…"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateEcriture}
              disabled={!neClientId || !neInvesti}
            >
              Créer l&apos;écriture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
