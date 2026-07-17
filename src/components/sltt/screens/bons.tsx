"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  FileText,
  Check,
  Search,
  Truck,
  ClipboardList,
  CheckCircle2,
  FilePen,
  Wallet,
  Package,
  Banknote,
  Trash2,
  X,
} from "lucide-react";

import { useStore, type BonMotif, type StockItem, type BonSortieCaisse } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { printHTML, htmlEscape, printBonSortieCaisseModule } from "@/lib/export";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EmptyState } from "@/components/sltt/empty-state";
import { ToneBadge } from "@/components/sltt/status-badge";
import { SocieteFilterSelect, SocieteBadge } from "@/components/sltt/societe-filter-select";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { matchesQuery } from "@/lib/search-filter";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";

const PAGE_SIZE = 8;

const motifTone: Record<BonMotif, "blue" | "indigo" | "amber"> = {
  Vente: "blue",
  Livraison: "indigo",
  Transfert: "amber",
};

const statutTone: Record<"Validé" | "Brouillon", "emerald" | "slate"> = {
  Validé: "emerald",
  Brouillon: "slate",
};

const motifs: BonMotif[] = ["Vente", "Livraison", "Transfert"];


export function BonsScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("bons:write");
  const canWriteCaisse = usePermission("bons:write-caisse");
  const go = useNav((s) => s.go);
  const selectedId = useNav((s) => s.selectedId);

  const allBons = useStore((s) => s.bons);
  const addBon = useStore((s) => s.addBon);
  const validateBon = useStore((s) => s.validateBon);
  const stock = useStore((s) => s.stock);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const bonSeq = useStore((s) => s.bonSeq);
  const bonSortieCaisseSeq = useStore((s) => s.bonSortieCaisseSeq);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);
  const addBonSortieCaisse = useStore((s) => s.addBonSortieCaisse);
  const removeBonSortieCaisse = useStore((s) => s.removeBonSortieCaisse);
  const selectedSocieteId = useNav((s) => s.selectedSocieteId);

  const [activeTab, setActiveTab] = useState<"marchandise" | "caisse">("marchandise");

  const bons = useMemo(
    () => (selectedSocieteId ? allBons.filter((b) => b.societeId === selectedSocieteId) : allBons),
    [allBons, selectedSocieteId],
  );

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [motifFilter, setMotifFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState<"all" | "Validé" | "Brouillon">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());

  const [open, setOpen] = useState(false);
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formClientId, setFormClientId] = useState("");
  const [formSocieteId, setFormSocieteId] = useState("");
  const [formStockId, setFormStockId] = useState("");
  const [formQuantite, setFormQuantite] = useState<string>("");
  const [formMotif, setFormMotif] = useState<BonMotif | "">("");
  const [formMontant, setFormMontant] = useState<string>("");

  const nextRef = `BS-${new Date().getFullYear()}-${String(bonSeq).padStart(4, "0")}`;
  const nextCaisseRef = `N°${bonSortieCaisseSeq}`;

  useEffect(() => {
    if (selectedId === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le routeur (nav-store) : ouvre le dialogue puis consomme le marqueur "new" de l'URL
      setOpen(true);
      go("bons");
    }
  }, [selectedId, go]);

  /* -------------------------------------------------------------- */
  /* SORTIE DE CAISSE (décaissement — sans rapport avec le stock)     */
  /* -------------------------------------------------------------- */

  const todayIso = new Date().toISOString().slice(0, 10);

  const [caisseOpen, setCaisseOpen] = useState(false);
  const [caisseDate, setCaisseDate] = useState(todayIso);
  const [caisseSocieteId, setCaisseSocieteId] = useState("");
  const [caisseLignes, setCaisseLignes] = useState<
    Array<{ date: string; beneficiaire: string; motif: string; montant: string }>
  >([{ date: todayIso, beneficiaire: "", motif: "", montant: "" }]);
  const [caisseSearch, setCaisseSearch] = useState("");
  const { target: caisseDeleteTarget, setTarget: setCaisseDeleteTarget, confirm: handleDeleteCaisse } = useDeleteConfirm<BonSortieCaisse>(
    removeBonSortieCaisse,
    (b) => b.id,
    (b) => b.reference,
    "Bon supprimé",
    "Impossible de supprimer le bon.",
  );

  const caisseStats = useMemo(
    () => ({
      total: bonsSortieCaisse.length,
      montantTotal: bonsSortieCaisse.reduce((sum, b) => sum + b.montantTotal, 0),
    }),
    [bonsSortieCaisse],
  );

  const filteredCaisse = useMemo(() => {
    const q = caisseSearch.trim().toLowerCase();
    if (!q) return bonsSortieCaisse;
    return bonsSortieCaisse.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        b.lignes.some((l) => l.beneficiaire.toLowerCase().includes(q) || l.motif.toLowerCase().includes(q)),
    );
  }, [bonsSortieCaisse, caisseSearch]);

  const caisseTotalSaisi = caisseLignes.reduce((sum, l) => sum + (Number(l.montant) || 0), 0);
  const caisseValid =
    !!caisseSocieteId &&
    caisseLignes.length > 0 &&
    caisseLignes.every((l) => l.beneficiaire.trim() && l.motif.trim() && Number(l.montant) > 0);

  function openCaisseDialog() {
    setCaisseDate(todayIso);
    setCaisseSocieteId(selectedSocieteId ?? societes[0]?.id ?? "");
    setCaisseLignes([{ date: todayIso, beneficiaire: "", motif: "", montant: "" }]);
    setCaisseOpen(true);
  }

  function addCaisseLigne() {
    setCaisseLignes((l) => [...l, { date: caisseDate, beneficiaire: "", motif: "", montant: "" }]);
  }

  function removeCaisseLigne(i: number) {
    setCaisseLignes((l) => l.filter((_, idx) => idx !== i));
  }

  function updateCaisseLigne(i: number, field: "date" | "beneficiaire" | "motif" | "montant", value: string) {
    setCaisseLignes((l) => l.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  function beneficiairesSummary(bon: BonSortieCaisse): string {
    if (bon.lignes.length === 0) return "—";
    const first = bon.lignes[0].beneficiaire;
    return bon.lignes.length > 1 ? `${first} +${bon.lignes.length - 1}` : first;
  }

  async function handleCreateCaisse() {
    if (!caisseValid) return;
    try {
      const bon = await addBonSortieCaisse({
        date: caisseDate,
        societeId: caisseSocieteId,
        lignes: caisseLignes.map((l) => ({
          date: l.date,
          beneficiaire: l.beneficiaire.trim(),
          motif: l.motif.trim(),
          montant: Number(l.montant) || 0,
        })),
      });
      toast({ title: "Bon de sortie créé", description: `${bon.reference} — ${formatFCFA(bon.montantTotal)}` });
      setCaisseOpen(false);
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Impossible de créer le bon de sortie.",
        variant: "destructive",
      });
    }
  }

  function handlePrintCaisse(bon: BonSortieCaisse) {
    const societe = societes.find((s) => s.id === bon.societeId);
    printBonSortieCaisseModule({
      reference: bon.reference,
      date: bon.date,
      societeNom: bon.societeNom,
      logoUrl: societe?.logoUrl,
      afficherNomAvecLogo: societe?.afficherNomAvecLogo,
      legal: societe && {
        adresse: societe.adresse,
        telephone: societe.telephone,
        rccm: societe.rccm,
        nif: societe.nif,
      },
      lignes: bon.lignes,
      montantTotal: bon.montantTotal,
    });
  }

  function handlePrintCaisseWithToast(bon: BonSortieCaisse) {
    handlePrintCaisse(bon);
    toast({
      title: "Bon prêt à imprimer",
      description: `${bon.reference} — ${formatFCFA(bon.montantTotal)}.`,
    });
  }

  const stats = useMemo(() => {
    let valides = 0;
    let brouillons = 0;
    let montantTotal = 0;
    for (const b of bons) {
      if (b.statut === "Validé") {
        valides++;
        // "Montant total" = valeur des sorties déjà confirmées (stock
        // décrémenté) — un brouillon n'est pas encore une sortie réelle et
        // ne doit pas gonfler ce total.
        montantTotal += b.montant;
      } else {
        brouillons++;
      }
    }
    return { total: bons.length, valides, brouillons, montantTotal };
  }, [bons]);

  const filtered = useMemo(() => {
    return bons.filter((b) => {
      if (!matchesQuery(b, ["reference", "clientNom", "marchandise"], search)) return false;
      if (clientFilter !== "all" && b.clientId !== clientFilter) return false;
      if (motifFilter !== "all" && b.motif !== motifFilter) return false;
      if (statutFilter !== "all" && b.statut !== statutFilter) return false;
      if (dateFilter && b.date !== dateFilter) return false;
      return true;
    });
  }, [bons, search, clientFilter, motifFilter, statutFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    search.trim() !== "" ||
    clientFilter !== "all" ||
    motifFilter !== "all" ||
    statutFilter !== "all" ||
    dateFilter !== "";

  const selectedStock: StockItem | undefined = useMemo(
    () => stock.find((s) => s.id === formStockId),
    [stock, formStockId],
  );
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === formClientId),
    [clients, formClientId],
  );

  const quantiteNum = Number(formQuantite) || 0;
  const stockDisponible = selectedStock?.quantite ?? 0;
  const depasseStock =
    selectedStock !== undefined && quantiteNum > stockDisponible;
  const montantNum = Number(formMontant) || 0;

  function clearFilters() {
    setSearch("");
    setClientFilter("all");
    setMotifFilter("all");
    setStatutFilter("all");
    setDateFilter("");
    setPage(1);
  }

  function resetForm() {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormClientId("");
    setFormSocieteId("");
    setFormStockId("");
    setFormQuantite("");
    setFormMotif("");
    setFormMontant("");
  }

  function openDialog() {
    resetForm();
    setOpen(true);
  }

  async function handleValider() {
    if (!selectedStock || !selectedClient || !formMotif || !formSocieteId) return;
    try {
      await addBon({
        date: formDate,
        clientId: formClientId,
        clientNom: selectedClient.nom,
        societeId: formSocieteId,
        stockId: selectedStock.id,
        marchandise: selectedStock.marchandise,
        quantite: quantiteNum,
        unite: selectedStock.unite,
        motif: formMotif,
        montant: montantNum,
        statut: "Validé",
      });
      toast({
        title: "Bon de sortie validé",
        description: "Bon de sortie validé — stock décrémenté.",
      });
      setOpen(false);
      resetForm();
    } catch {
      toast({
        title: "Validation impossible — stock insuffisant",
        description: "Le stock disponible est inférieur à la quantité demandée. Le bon a été enregistré comme brouillon.",
        variant: "destructive",
      });
    }
  }

  function handleSaveDraft() {
    if (!selectedStock || !selectedClient || !formMotif || !formSocieteId) return;
    addBon({
      date: formDate,
      clientId: formClientId,
      clientNom: selectedClient.nom,
      societeId: formSocieteId,
      stockId: selectedStock.id,
      marchandise: selectedStock.marchandise,
      quantite: quantiteNum,
      unite: selectedStock.unite,
      motif: formMotif,
      montant: montantNum,
      statut: "Brouillon",
    });
    toast({
      title: "Brouillon enregistré",
      description: "Le bon a été sauvegardé comme brouillon.",
    });
    setOpen(false);
    resetForm();
  }

  async function handleValidateBon(id: string, ref: string) {
    // Empêche un double-clic de déclencher deux vérifications de stock en
    // parallèle avant que la première n'ait eu le temps de décrémenter.
    if (validatingIds.has(id)) return;
    setValidatingIds((prev) => new Set(prev).add(id));
    try {
      const stockSuffisant = await validateBon(id);
      if (stockSuffisant) {
        toast({
          title: "Bon validé",
          description: `${ref} — stock décrémenté.`,
        });
      } else {
        toast({
          title: "Validation impossible — stock insuffisant",
          description: `${ref} n'a pas été validé : le stock disponible est inférieur à la quantité demandée.`,
          variant: "destructive",
        });
      }
    } finally {
      setValidatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function buildBonHTML(b: {
    reference: string;
    date: string;
    clientNom: string;
    societeNom: string;
    marchandise: string;
    quantite: number;
    unite: string;
    motif: BonMotif;
    montant: number;
    statut: string;
  }) {
    const motifColors: Record<string, string> = {
      Vente: "background:#dbeafe;color:#1e3a8a",
      Livraison: "background:#e0e7ff;color:#3730a3",
      Transfert: "background:#fef3c7;color:#92400e",
    };
    return `
      <h1>Bon de sortie — Marchandise</h1>
      <div class="subtitle">Référence : <strong>${htmlEscape(b.reference)}</strong> · <span class="badge" style="${motifColors[b.motif] ?? ""}">${htmlEscape(b.motif)}</span></div>
      <table>
        <tbody>
          <tr><th style="width:40%">Date</th><td>${formatDateShort(b.date)}</td></tr>
          <tr><th>Société</th><td>${htmlEscape(b.societeNom)}</td></tr>
          <tr><th>Client</th><td>${htmlEscape(b.clientNom)}</td></tr>
          <tr><th>Marchandise</th><td>${htmlEscape(b.marchandise)}</td></tr>
          <tr><th>Quantité sortie</th><td>${b.quantite} ${htmlEscape(b.unite)}</td></tr>
          <tr><th>Motif de sortie</th><td>${htmlEscape(b.motif)}</td></tr>
          <tr class="total-row"><th>Montant</th><td class="num">${formatFCFA(b.montant)}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:64px;display:flex;justify-content:space-between">
        <div>
          <div style="border-top:1px solid #94a3b8;width:200px;padding-top:6px;font-size:11px;color:#64748b">Signature du responsable</div>
        </div>
        <div>
          <div style="border-top:1px solid #94a3b8;width:200px;padding-top:6px;font-size:11px;color:#64748b;text-align:right">Cachet ${htmlEscape(b.societeNom)}</div>
        </div>
      </div>
    `;
  }

  function bonBrand(societeId: string) {
    const societe = societes.find((s) => s.id === societeId);
    if (!societe) return undefined;
    return {
      logoUrl: societe.logoUrl,
      name: societe.nom,
      afficherNomAvecLogo: societe.afficherNomAvecLogo,
      legal: {
        adresse: societe.adresse,
        telephone: societe.telephone,
        rccm: societe.rccm,
        nif: societe.nif,
      },
    };
  }

  function handleView(ref: string) {
    const b = bons.find((x) => x.reference === ref);
    if (!b) return;
    printHTML(`Bon ${ref}`, buildBonHTML(b), bonBrand(b.societeId));
  }

  function handlePrint(ref: string) {
    const b = bons.find((x) => x.reference === ref);
    if (!b) return;
    printHTML(`Bon ${ref}`, buildBonHTML(b), bonBrand(b.societeId));
    toast({
      title: "Bon prêt à imprimer",
      description: `${ref} — ${b.clientNom}.`,
    });
  }

  const tabMeta = {
    marchandise: {
      description: "Sorties de stock : validation, stock et justificatifs clients.",
      cta: "Nouveau bon de sortie",
      onCreate: openDialog,
    },
    caisse: {
      description: "Décaissements espèces : honoraires, frais divers, justificatifs caisse.",
      cta: "Nouvelle sortie de caisse",
      onCreate: openCaisseDialog,
    },
  } as const;

  const currentTab = tabMeta[activeTab];

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "marchandise" | "caisse")}
        className="gap-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {currentTab.description}
            </p>
          </div>
          {(activeTab === "caisse" ? canWriteCaisse : canWrite) && (
            <Button
              onClick={currentTab.onCreate}
              className="shrink-0 self-start"
            >
              <Plus className="size-4" />
              {currentTab.cta}
            </Button>
          )}
        </div>

        <TabsList
          className={cn(
            "grid h-auto w-full grid-cols-1 gap-1 bg-slate-100/90 p-1.5 dark:bg-slate-800/60 sm:grid-cols-2",
            "rounded-xl",
          )}
        >
          <TabsTrigger
            value="marchandise"
            className={cn(
              "group h-auto flex-col items-stretch gap-1 rounded-lg px-4 py-3 text-left",
              "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/80",
              "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:ring-slate-700",
            )}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    "bg-blue-50 text-blue-700 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500",
                    "dark:bg-blue-950/50 dark:text-blue-300 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
                  )}
                >
                  <Package className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Marchandises
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                    Entreposage · sorties stock
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
                  "group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600",
                  "dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
                )}
              >
                {bons.length}
              </span>
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="caisse"
            className={cn(
              "group h-auto flex-col items-stretch gap-1 rounded-lg px-4 py-3 text-left",
              "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/80",
              "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:ring-slate-700",
            )}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    "bg-emerald-50 text-emerald-700 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500",
                    "dark:bg-emerald-950/50 dark:text-emerald-300 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
                  )}
                >
                  <Banknote className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Caisse
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                    Décaissements · espèces
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
                  "group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600",
                  "dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
                )}
              >
                {bonsSortieCaisse.length}
              </span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marchandise" className="mt-0 space-y-6">

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total bons"
          value={String(stats.total)}
          icon={ClipboardList}
          tone="blue"
          sublabel="bons enregistrés"
        />
        <KpiCard
          label="Validés"
          value={String(stats.valides)}
          icon={CheckCircle2}
          tone="emerald"
          sublabel="sorties confirmées"
        />
        <KpiCard
          label="Brouillons"
          value={String(stats.brouillons)}
          icon={FilePen}
          tone="amber"
          sublabel="en attente de validation"
        />
        <KpiCard
          label="Montant total"
          value={formatFCFA(stats.montantTotal)}
          icon={Wallet}
          tone="indigo"
          sublabel="valeur des sorties"
        />
      </div>

      {stats.brouillons > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3">
          <FilePen className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {stats.brouillons} bon{stats.brouillons > 1 ? "s" : ""} en brouillon
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              Finalisez ou validez les bons en attente pour mettre à jour le stock.
            </p>
          </div>
        </div>
      )}

      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Référence, client, marchandise…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 pl-9"
              aria-label="Rechercher un bon"
            />
          </div>

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

          <Select
            value={motifFilter}
            onValueChange={(v) => {
              setMotifFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par motif">
              <SelectValue placeholder="Motif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les motifs</SelectItem>
              {motifs.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statutFilter}
            onValueChange={(v) => {
              setStatutFilter(v as typeof statutFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Validé">Validé</SelectItem>
              <SelectItem value="Brouillon">Brouillon</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full sm:w-40"
            aria-label="Filtrer par date"
          />

          <SocieteFilterSelect className="w-full sm:w-44" />

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
            {filtered.length} bon{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Truck className="size-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Liste des bons de sortie
          </h2>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucun bon trouvé"
            description={
              hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau bon de sortie."
                : "Enregistrez votre premier bon pour tracer une sortie de marchandise."
            }
            action={
              !hasActiveFilters && canWrite ? (
                <Button onClick={openDialog}>
                  <Plus className="size-4" />
                  Nouveau bon de sortie
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((b) => {
                const isBrouillon = b.statut === "Brouillon";
                return (
                  <Card
                    key={b.id}
                    className={cn(
                      "border-border/80 p-4 shadow-sm",
                      isBrouillon && "bg-amber-50/25 dark:bg-amber-950/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{b.reference}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{b.clientNom}</p>
                      </div>
                      <ToneBadge tone={statutTone[b.statut]}>{b.statut}</ToneBadge>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Date</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(b.date)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Société</dt>
                        <dd><SocieteBadge societeNom={b.societeNom} size="sm" /></dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Marchandise</dt>
                        <dd className="truncate text-right text-slate-700 dark:text-slate-300">{b.marchandise}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Motif</dt>
                        <dd><ToneBadge tone={motifTone[b.motif]}>{b.motif}</ToneBadge></dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Quantité</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">{b.quantite} {b.unite}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Montant</dt>
                        <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatFCFA(b.montant)}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                      {isBrouillon && canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-amber-600 dark:text-amber-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          aria-label={`Valider ${b.reference}`}
                          title="Valider le bon"
                          disabled={validatingIds.has(b.id)}
                          onClick={() => handleValidateBon(b.id, b.reference)}
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-slate-500 dark:text-slate-400 hover:text-primary"
                        aria-label={`Visualiser ${b.reference}`}
                        title="Visualiser"
                        onClick={() => handleView(b.reference)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-slate-500 dark:text-slate-400 hover:text-primary"
                        aria-label={`Imprimer ${b.reference}`}
                        title="PDF / Imprimer"
                        onClick={() => handlePrint(b.reference)}
                      >
                        <FileText className="size-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table aria-label="Liste des bons de sortie">
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Référence
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Client
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Société
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Marchandise
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Motif
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Qté
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Montant
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
                  {paged.map((b) => {
                    const isBrouillon = b.statut === "Brouillon";
                    return (
                      <TableRow
                        key={b.id}
                        className={cn(
                          "border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60",
                          isBrouillon && "bg-amber-50/25 dark:bg-amber-950/20",
                        )}
                      >
                        <TableCell className="px-4 py-3.5">
                          <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                            {b.reference}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400 sm:hidden">
                            {formatDateShort(b.date)}
                          </p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300 sm:table-cell">
                          {formatDateShort(b.date)}
                        </TableCell>
                        <TableCell className="max-w-[160px] px-4 py-3.5">
                          <p className="truncate font-medium text-slate-700 dark:text-slate-300">
                            {b.clientNom}
                          </p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                          <SocieteBadge societeNom={b.societeNom} size="sm" />
                        </TableCell>
                        <TableCell className="hidden max-w-[140px] px-4 py-3.5 md:table-cell">
                          <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                            <Package className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            <span className="truncate">{b.marchandise}</span>
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <ToneBadge tone={motifTone[b.motif]}>{b.motif}</ToneBadge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {b.quantite}{" "}
                          <span className="text-xs text-slate-500 dark:text-slate-400">{b.unite}</span>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100 sm:table-cell">
                          {formatFCFA(b.montant)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <ToneBadge tone={statutTone[b.statut]}>{b.statut}</ToneBadge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {isBrouillon && canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-11 text-amber-600 dark:text-amber-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                aria-label={`Valider ${b.reference}`}
                                title="Valider le bon"
                                disabled={validatingIds.has(b.id)}
                                onClick={() => handleValidateBon(b.id, b.reference)}
                              >
                                <Check className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 text-slate-500 dark:text-slate-400 hover:text-primary"
                              aria-label={`Visualiser ${b.reference}`}
                              title="Visualiser"
                              onClick={() => handleView(b.reference)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 text-slate-500 dark:text-slate-400 hover:text-primary"
                              aria-label={`Imprimer ${b.reference}`}
                              title="PDF / Imprimer"
                              onClick={() => handlePrint(b.reference)}
                            >
                              <FileText className="size-4" />
                            </Button>
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
              itemLabel={`bon${filtered.length !== 1 ? "s" : ""}`}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

        </TabsContent>

        <TabsContent value="caisse" className="mt-0 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Bons émis"
              value={String(caisseStats.total)}
              icon={Banknote}
              tone="emerald"
              sublabel="décaissements enregistrés"
            />
            <KpiCard
              label="Total décaissé"
              value={formatFCFA(caisseStats.montantTotal)}
              icon={Wallet}
              tone="indigo"
              sublabel="toutes sorties de caisse"
            />
          </div>

          <Card className="p-4 shadow-sm border-border/80">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Référence, bénéficiaire, motif…"
                  value={caisseSearch}
                  onChange={(e) => setCaisseSearch(e.target.value)}
                  className="h-10 pl-9"
                  aria-label="Rechercher un bon de sortie de caisse"
                />
              </div>
              <p className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {filteredCaisse.length} bon{filteredCaisse.length !== 1 ? "s" : ""}
              </p>
            </div>
          </Card>

          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Banknote className="size-4 text-slate-400 dark:text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Sorties de caisse
              </h2>
            </div>

            {filteredCaisse.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Banknote className="size-7" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Aucune sortie de caisse
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {caisseSearch
                    ? "Modifiez votre recherche ou enregistrez une nouvelle sortie."
                    : "Enregistrez un décaissement (honoraires, frais divers…)."}
                </p>
                {!caisseSearch && canWriteCaisse && (
                  <Button className="mt-5" onClick={openCaisseDialog}>
                    <Plus className="size-4" />
                    Nouvelle sortie de caisse
                  </Button>
                )}
              </div>
            ) : (
              <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredCaisse.map((b) => (
                  <Card key={b.id} className="border-border/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{b.reference}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{beneficiairesSummary(b)}</p>
                      </div>
                      <SocieteBadge societeNom={b.societeNom} size="sm" />
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Date</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(b.date)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Motif</dt>
                        <dd className="truncate text-right text-slate-700 dark:text-slate-300">
                          {b.lignes.map((l) => l.motif).join(", ")}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Montant</dt>
                        <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatFCFA(b.montantTotal)}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-slate-500 dark:text-slate-400 hover:text-primary"
                        aria-label={`Imprimer ${b.reference}`}
                        title="PDF / Imprimer"
                        onClick={() => handlePrintCaisseWithToast(b)}
                      >
                        <FileText className="size-4" />
                      </Button>
                      {canWriteCaisse && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-slate-400 hover:text-red-600"
                          aria-label={`Supprimer ${b.reference}`}
                          title="Supprimer"
                          onClick={() => setCaisseDeleteTarget(b)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table aria-label="Liste des bons de sortie de caisse">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Référence
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Date
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Bénéficiaire(s)
                      </TableHead>
                      <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                        Société
                      </TableHead>
                      <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                        Motif
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Montant
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCaisse.map((b) => (
                      <TableRow key={b.id} className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                        <TableCell className="px-4 py-3.5">
                          <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{b.reference}</p>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                          {formatDateShort(b.date)}
                        </TableCell>
                        <TableCell className="max-w-[180px] px-4 py-3.5">
                          <p className="truncate font-medium text-slate-700 dark:text-slate-300">{beneficiairesSummary(b)}</p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 md:table-cell">
                          <SocieteBadge societeNom={b.societeNom} size="sm" />
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] px-4 py-3.5 md:table-cell">
                          <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                            {b.lignes.map((l) => l.motif).join(", ")}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {formatFCFA(b.montantTotal)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 text-slate-500 dark:text-slate-400 hover:text-primary"
                              aria-label={`Imprimer ${b.reference}`}
                              title="PDF / Imprimer"
                              onClick={() => handlePrintCaisseWithToast(b)}
                            >
                              <FileText className="size-4" />
                            </Button>
                            {canWriteCaisse && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-11 text-slate-400 hover:text-red-600"
                                aria-label={`Supprimer ${b.reference}`}
                                title="Supprimer"
                                onClick={() => setCaisseDeleteTarget(b)}
                              >
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
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle>Nouveau bon de sortie</DialogTitle>
              <Badge
                variant="outline"
                className="border-slate-200 dark:border-slate-700 bg-slate-50 font-mono text-xs text-slate-500 dark:text-slate-400"
              >
                {nextRef}
              </Badge>
            </div>
            <DialogDescription>
              Sélectionnez le client, la marchandise et la quantité à sortir du stock.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bs-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date
                </Label>
                <Input
                  id="bs-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-client" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Client <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select value={formClientId} onValueChange={setFormClientId}>
                    <SelectTrigger id="bs-client" className="h-10 w-full">
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
                  <QuickClientButton onCreated={setFormClientId} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-stock" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Marchandise <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formStockId}
                  onValueChange={(v) => {
                    setFormStockId(v);
                    // La société du bon est déduite de l'article choisi (chaque
                    // article appartient à une seule société) — pas de sélecteur
                    // société séparé, ce qui évite une saisie redondante.
                    const picked = stock.find((s) => s.id === v);
                    if (picked) {
                      setFormSocieteId(picked.societeId);
                      if (!formClientId && picked.clientId) setFormClientId(picked.clientId);
                    }
                  }}
                >
                  <SelectTrigger id="bs-stock" className="h-10 w-full">
                    <SelectValue placeholder="Sélectionner une marchandise" />
                  </SelectTrigger>
                  <SelectContent>
                    {stock.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.marchandise} — {s.societeNom} (stock : {s.quantite} {s.unite})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStock && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Société : <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStock.societeNom}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-quantite" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Quantité à sortir <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bs-quantite"
                  type="number"
                  min={0}
                  value={formQuantite}
                  onChange={(e) => setFormQuantite(e.target.value)}
                  aria-invalid={depasseStock}
                  placeholder="0"
                  className="h-10"
                />
                {depasseStock && selectedStock && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    La quantité dépasse le stock disponible ({stockDisponible}{" "}
                    {selectedStock.unite}).
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-motif" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Motif <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formMotif}
                  onValueChange={(v) => setFormMotif(v as BonMotif)}
                >
                  <SelectTrigger id="bs-motif" className="h-10 w-full">
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    {motifs.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-montant" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Montant <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="bs-montant"
                    type="number"
                    min={0}
                    value={formMontant}
                    onChange={(e) => setFormMontant(e.target.value)}
                    placeholder="0"
                    className="h-10 pr-16"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    FCFA
                  </span>
                </div>
              </div>
            </div>

            <div>
              <BonPreview
                reference={nextRef}
                date={formDate}
                client={selectedClient?.nom}
                marchandise={selectedStock?.marchandise}
                quantite={quantiteNum}
                unite={selectedStock?.unite}
                motif={formMotif as BonMotif | ""}
                montant={montantNum}
                societeNom={selectedStock?.societeNom}
                logoUrl={societes.find((s) => s.id === formSocieteId)?.logoUrl}
                afficherNomAvecLogo={societes.find((s) => s.id === formSocieteId)?.afficherNomAvecLogo}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!formClientId || !formStockId || !formMotif || quantiteNum <= 0 || montantNum <= 0}
            >
              <FilePen className="size-4" />
              Brouillon
            </Button>
            <Button
              onClick={handleValider}
              disabled={
                depasseStock ||
                !formClientId ||
                !formStockId ||
                !formMotif ||
                quantiteNum <= 0 ||
                montantNum <= 0
              }
            >
              <Check className="size-4" />
              Valider le bon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={caisseOpen} onOpenChange={setCaisseOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle>Nouvelle sortie de caisse</DialogTitle>
              <Badge
                variant="outline"
                className="border-slate-200 dark:border-slate-700 bg-slate-50 font-mono text-xs text-slate-500 dark:text-slate-400"
              >
                {nextCaisseRef}
              </Badge>
            </div>
            <DialogDescription>
              Décaissement en espèces — indépendant de l’entreposage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caisse-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date du bon
              </Label>
              <Input
                id="caisse-date"
                type="date"
                value={caisseDate}
                onChange={(e) => setCaisseDate(e.target.value)}
                className="h-10 w-full sm:w-52"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caisse-societe" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Société <span className="text-red-500">*</span>
              </Label>
              <Select value={caisseSocieteId} onValueChange={setCaisseSocieteId}>
                <SelectTrigger id="caisse-societe" className="h-10 w-full sm:w-52">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Bénéficiaires
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={addCaisseLigne} className="h-8 text-primary">
                  <Plus className="size-3.5" />
                  Ajouter une ligne
                </Button>
              </div>

              <div className="mb-1 grid grid-cols-[100px_1fr_1fr_110px_24px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <span>Date</span>
                <span>Prénom et Nom</span>
                <span>Motif</span>
                <span className="text-right">Montant</span>
                <span />
              </div>

              <div className="space-y-2">
                {caisseLignes.map((l, i) => (
                  <div key={i} className="grid grid-cols-[100px_1fr_1fr_110px_24px] items-center gap-2">
                    <Input
                      type="date"
                      value={l.date}
                      onChange={(e) => updateCaisseLigne(i, "date", e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Input
                      value={l.beneficiaire}
                      onChange={(e) => updateCaisseLigne(i, "beneficiaire", e.target.value)}
                      placeholder="ex. Kamisso"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={l.motif}
                      onChange={(e) => updateCaisseLigne(i, "motif", e.target.value)}
                      placeholder="ex. Honoraire huissier"
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={l.montant}
                      onChange={(e) => updateCaisseLigne(i, "montant", e.target.value)}
                      placeholder="0"
                      className="h-9 text-right text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeCaisseLigne(i)}
                      disabled={caisseLignes.length === 1}
                      className="flex size-6 items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:bg-red-50 dark:bg-red-950/40 hover:text-red-500 disabled:pointer-events-none"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50/60 dark:bg-slate-800/60 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total</span>
              <span className="text-base font-bold tabular-nums text-blue-700">{formatFCFA(caisseTotalSaisi)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCaisseOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCaisse} disabled={!caisseValid}>
              <Check className="size-4" />
              Enregistrer le bon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!caisseDeleteTarget}
        onOpenChange={(v) => !v && setCaisseDeleteTarget(null)}
        title="Supprimer ce bon de sortie ?"
        description="Cette action est irréversible. Le bon et ses lignes seront définitivement supprimés."
        onConfirm={handleDeleteCaisse}
      />
    </div>
  );
}

function BonPreview({
  reference,
  date,
  client,
  marchandise,
  quantite,
  unite,
  motif,
  montant,
  societeNom,
  logoUrl,
  afficherNomAvecLogo = true,
}: {
  reference: string;
  date: string;
  client?: string;
  marchandise?: string;
  quantite: number;
  unite?: string;
  motif: BonMotif | "";
  montant: number;
  societeNom?: string;
  logoUrl?: string;
  afficherNomAvecLogo?: boolean;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Date",
      value: date ? formatDateShort(date) : "—",
    },
    {
      label: "Client",
      value: client || <span className="text-slate-400 dark:text-slate-500">À renseigner</span>,
    },
    {
      label: "Marchandise",
      value:
        marchandise || <span className="text-slate-400 dark:text-slate-500">À renseigner</span>,
    },
    {
      label: "Quantité",
      value: quantite > 0 ? `${quantite} ${unite || ""}`.trim() : "—",
    },
    {
      label: "Motif",
      value: motif || <span className="text-slate-400 dark:text-slate-500">À renseigner</span>,
    },
    {
      label: "Montant",
      value: montant > 0 ? formatFCFA(montant) : "—",
    },
  ];

  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 font-[var(--font-heading)]">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        {logoUrl ? (
          // Hauteur fixe, largeur libre : certains logos société sont des bannières
          // larges (ratio ~4:1), pas des badges carrés — une boîte size-10 les
          // écraserait en un filet illisible.
          <img src={logoUrl} alt={societeNom || "Logo société"} className="h-10 w-auto max-w-28 object-contain" />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="size-5" />
          </div>
        )}
        {afficherNomAvecLogo && (
        <div>
          <p className="font-bold leading-tight text-slate-900 dark:text-slate-100">
            {societeNom || "SLTT"}
          </p>
          <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
            Bon de sortie — Marchandise
          </p>
        </div>
        )}
      </div>

      <div className="my-5 text-center">
        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          BON DE SORTIE — MARCHANDISE
        </p>
        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{reference}</p>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.label}
                className={cn(
                  "border-b border-slate-100 dark:border-slate-800 last:border-0",
                  i % 2 === 0 && "bg-slate-50/50 dark:bg-slate-800/50",
                )}
              >
                <td className="w-1/3 px-3 py-1.5 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  {r.label}
                </td>
                <td className="px-3 py-1.5 tabular-nums text-slate-800 dark:text-slate-200">
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">Signature du responsable</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">__________</div>
      </div>
    </div>
  );
}
