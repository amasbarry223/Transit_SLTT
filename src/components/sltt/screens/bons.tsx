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
} from "lucide-react";

import { useStore, type BonMotif, type StockItem } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { printHTML, htmlEscape } from "@/lib/export";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";

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
  const go = useNav((s) => s.go);
  const selectedId = useNav((s) => s.selectedId);

  const bons = useStore((s) => s.bons);
  const addBon = useStore((s) => s.addBon);
  const validateBon = useStore((s) => s.validateBon);
  const stock = useStore((s) => s.stock);
  const clients = useStore((s) => s.clients);
  const bonSeq = useStore((s) => s.bonSeq);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [motifFilter, setMotifFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState<"all" | "Validé" | "Brouillon">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formClientId, setFormClientId] = useState("");
  const [formStockId, setFormStockId] = useState("");
  const [formQuantite, setFormQuantite] = useState<string>("");
  const [formMotif, setFormMotif] = useState<BonMotif | "">("");
  const [formMontant, setFormMontant] = useState<string>("");

  const nextRef = `BS-2026-${String(bonSeq).padStart(4, "0")}`;

  // Ouverture directe du formulaire depuis un raccourci externe (CTA dashboard).
  useEffect(() => {
    if (selectedId === "new") {
      setOpen(true);
      go("bons");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const stats = useMemo(() => {
    let valides = 0;
    let brouillons = 0;
    let montantTotal = 0;
    for (const b of bons) {
      if (b.statut === "Validé") valides++;
      else brouillons++;
      montantTotal += b.montant;
    }
    return { total: bons.length, valides, brouillons, montantTotal };
  }, [bons]);

  const filtered = useMemo(() => {
    return bons.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${b.reference} ${b.clientNom} ${b.marchandise}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
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
    setFormStockId("");
    setFormQuantite("");
    setFormMotif("");
    setFormMontant("");
  }

  function openDialog() {
    resetForm();
    setOpen(true);
  }

  function handleValider() {
    if (!selectedStock || !selectedClient || !formMotif) return;
    addBon({
      date: formDate,
      clientId: formClientId,
      clientNom: selectedClient.nom,
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
  }

  function handleSaveDraft() {
    if (!selectedStock || !selectedClient || !formMotif) return;
    addBon({
      date: formDate,
      clientId: formClientId,
      clientNom: selectedClient.nom,
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
    const stockSuffisant = await validateBon(id);
    if (stockSuffisant) {
      toast({
        title: "Bon validé",
        description: `${ref} — stock décrémenté.`,
      });
    } else {
      toast({
        title: "Bon validé — stock insuffisant",
        description: `${ref} — la quantité dépassait le stock disponible, il a été ramené à 0.`,
        variant: "destructive",
      });
    }
  }

  function buildBonHTML(b: {
    reference: string;
    date: string;
    clientNom: string;
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
      <h1>Bon de sortie</h1>
      <div class="subtitle">Référence : <strong>${htmlEscape(b.reference)}</strong> · <span class="badge" style="${motifColors[b.motif] ?? ""}">${htmlEscape(b.motif)}</span></div>
      <table>
        <tbody>
          <tr><th style="width:40%">Date</th><td>${formatDateShort(b.date)}</td></tr>
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
          <div style="border-top:1px solid #94a3b8;width:200px;padding-top:6px;font-size:11px;color:#64748b;text-align:right">Cachet SLTT</div>
        </div>
      </div>
    `;
  }

  function handleView(ref: string) {
    const b = bons.find((x) => x.reference === ref);
    if (!b) return;
    printHTML(`Bon ${ref}`, buildBonHTML(b));
  }

  function handlePrint(ref: string) {
    const b = bons.find((x) => x.reference === ref);
    if (!b) return;
    printHTML(`Bon ${ref}`, buildBonHTML(b));
    toast({
      title: "Bon prêt à imprimer",
      description: `${ref} — ${b.clientNom}.`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bons de sortie"
        description="Sorties de marchandises et justificatifs"
      >
        <Button onClick={openDialog}>
          <Plus className="size-4" />
          Nouveau bon de sortie
        </Button>
      </PageHeader>

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
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <ClipboardList className="size-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Aucun bon trouvé
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau bon de sortie."
                : "Enregistrez votre premier bon pour tracer une sortie de marchandise."}
            </p>
            {!hasActiveFilters && (
              <Button className="mt-5" onClick={openDialog}>
                <Plus className="size-4" />
                Nouveau bon de sortie
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
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
                            {isBrouillon && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-amber-600 dark:text-amber-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                aria-label={`Valider ${b.reference}`}
                                title="Valider le bon"
                                onClick={() => handleValidateBon(b.id, b.reference)}
                              >
                                <Check className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 dark:text-slate-400 hover:text-primary"
                              aria-label={`Visualiser ${b.reference}`}
                              title="Visualiser"
                              onClick={() => handleView(b.reference)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-500 dark:text-slate-400 hover:text-primary"
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
                <Select value={formStockId} onValueChange={setFormStockId}>
                  <SelectTrigger id="bs-stock" className="h-10 w-full">
                    <SelectValue placeholder="Sélectionner une marchandise" />
                  </SelectTrigger>
                  <SelectContent>
                    {stock.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.marchandise} (stock : {s.quantite} {s.unite})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  Montant
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

            <div className="hidden md:block">
              <BonPreview
                reference={nextRef}
                date={formDate}
                client={selectedClient?.nom}
                marchandise={selectedStock?.marchandise}
                quantite={quantiteNum}
                unite={selectedStock?.unite}
                motif={formMotif as BonMotif | ""}
                montant={montantNum}
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
              disabled={!formClientId || !formStockId || !formMotif || quantiteNum <= 0}
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
                quantiteNum <= 0
              }
            >
              <Check className="size-4" />
              Valider le bon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
}: {
  reference: string;
  date: string;
  client?: string;
  marchandise?: string;
  quantite: number;
  unite?: string;
  motif: BonMotif | "";
  montant: number;
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
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="size-5" />
        </div>
        <div>
          <p className="font-bold leading-tight text-slate-900 dark:text-slate-100">SLTT</p>
          <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
            Société Traoré de Logistique,
            <br />
            Transit et Transport
          </p>
        </div>
      </div>

      <div className="my-5 text-center">
        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          BON DE SORTIE
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
