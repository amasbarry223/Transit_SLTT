"use client";

import { useState } from "react";
import {
  Package,
  PackagePlus,
  PackageMinus,
  Wallet,
  ArrowLeftRight,
  AlertTriangle,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import { useStore } from "@/lib/store";
import type { StockItem } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge, StockStatutBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const motifs = ["Vente", "Livraison", "Transfert", "Autre"] as const;
type SortieMotif = (typeof motifs)[number];

export function EntreposageScreen() {
  const { toast } = useToast();
  const stock = useStore((s) => s.stock);
  const mouvements = useStore((s) => s.mouvements);
  const addStockEntry = useStore((s) => s.addStockEntry);
  const addStockExit = useStore((s) => s.addStockExit);

  const [tabValue, setTabValue] = useState("stock");

  // ---- Entry dialog state ----
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryStockId, setEntryStockId] = useState<string>("");
  const [entryQty, setEntryQty] = useState<string>("1");
  const [entryResp, setEntryResp] = useState<string>("Oumar Cissé");

  // ---- Exit dialog state ----
  const [exitOpen, setExitOpen] = useState(false);
  const [exitStockId, setExitStockId] = useState<string>("");
  const [exitQty, setExitQty] = useState<string>("1");
  const [exitResp, setExitResp] = useState<string>("Oumar Cissé");
  const [exitMotif, setExitMotif] = useState<SortieMotif>("Vente");

  const articlesEnStock = stock.length;
  const valeurStock = stock.reduce(
    (acc, s) => acc + s.sommePayee + s.resteAPayer,
    0,
  );
  const mouvementsCeMois = mouvements.length;
  const alertesStockFaible = stock.filter((s) => s.quantite < s.seuil).length;

  function openEntry(stockId: string | null) {
    const id = stockId ?? stock[0]?.id ?? "";
    setEntryStockId(id);
    setEntryQty("1");
    setEntryResp("Oumar Cissé");
    setEntryOpen(true);
  }

  function openExit(stockId: string | null) {
    const id = stockId ?? stock[0]?.id ?? "";
    setExitStockId(id);
    setExitQty("1");
    setExitResp("Oumar Cissé");
    setExitMotif("Vente");
    setExitOpen(true);
  }

  function notifyHistory(marchandise: string) {
    toast({
      title: `Historique des mouvements pour ${marchandise}`,
      description: "Affichage de l'historique dans l'onglet dédié.",
    });
    setTabValue("mouvements");
  }

  function submitEntry() {
    if (!entryStockId) return;
    const qty = parseInt(entryQty, 10);
    if (!qty || qty <= 0) return;
    addStockEntry(entryStockId, qty, entryResp.trim() || "Oumar Cissé");
    toast({ title: "Entrée enregistrée — stock mis à jour" });
    setEntryOpen(false);
  }

  function submitExit() {
    if (!exitStockId) return;
    const qty = parseInt(exitQty, 10);
    if (!qty || qty <= 0) return;
    const item = stock.find((s) => s.id === exitStockId);
    if (!item || qty > item.quantite) return;
    addStockExit(exitStockId, qty, exitResp.trim() || "Oumar Cissé");
    toast({ title: "Sortie enregistrée — stock décrémenté" });
    setExitOpen(false);
  }

  const entryQtyNum = parseInt(entryQty, 10) || 0;
  const entryDisabled = !entryStockId || entryQtyNum <= 0;

  const exitStock = stock.find((s) => s.id === exitStockId);
  const exitQtyNum = parseInt(exitQty, 10) || 0;
  const exitOverflow = exitStock != null && exitQtyNum > exitStock.quantite;
  const exitDisabled =
    !exitStockId || exitQtyNum <= 0 || exitOverflow;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entreposage"
        description="Gestion du stock et des mouvements"
      >
        <Button
          variant="outline"
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          onClick={() => openEntry(null)}
        >
          <PackagePlus className="size-4" />
          Entrée de marchandise
        </Button>
        <Button
          variant="outline"
          className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          onClick={() => openExit(null)}
        >
          <PackageMinus className="size-4" />
          Sortie
        </Button>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Articles en stock"
          value={String(articlesEnStock)}
          icon={Package}
          tone="blue"
          sublabel="Références distinctes"
        />
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Wallet}
          tone="indigo"
          sublabel="Valeur totale"
        />
        <KpiCard
          label="Mouvements ce mois"
          value={String(mouvementsCeMois)}
          icon={ArrowLeftRight}
          tone="emerald"
          sublabel="Entrées et sorties"
        />
        <KpiCard
          label="Alertes stock faible"
          value={String(alertesStockFaible)}
          icon={AlertTriangle}
          tone="red"
          sublabel="À réapprovisionner"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="mouvements">Historique des mouvements</TabsTrigger>
        </TabsList>

        {/* Tab: Stock */}
        <TabsContent value="stock">
          <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Marchandise
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Quantité disponible
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Unité
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Dépositaire
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Commercial rattaché
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Somme payée
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Reste à payer
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Statut stock
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <StockRow
                    key={item.id}
                    item={item}
                    onEntry={(id) => openEntry(id)}
                    onExit={(id) => openExit(id)}
                    onHistory={(m) => notifyHistory(m)}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab: Mouvements */}
        <TabsContent value="mouvements">
          <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Date
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Type
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Marchandise
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Quantité
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Responsable
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Bon lié
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.map((m) => {
                  const isEntree = m.type === "Entrée";
                  const hasBon = m.bonRef && m.bonRef !== "—";
                  return (
                    <TableRow
                      key={m.id}
                      className="hover:bg-slate-50/60 border-b border-border"
                    >
                      <TableCell className="text-slate-600 tabular-nums">
                        {formatDateShort(m.date)}
                      </TableCell>
                      <TableCell>
                        <ToneBadge
                          tone={isEntree ? "emerald" : "amber"}
                          dot={false}
                          className="gap-1"
                        >
                          {isEntree ? (
                            <ArrowDownToLine className="size-3" />
                          ) : (
                            <ArrowUpFromLine className="size-3" />
                          )}
                          {m.type}
                        </ToneBadge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {m.marchandise}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-700">
                        {m.quantite} {m.unite}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {m.responsable}
                      </TableCell>
                      <TableCell>
                        {hasBon ? (
                          <span className="text-primary text-xs font-mono hover:underline cursor-pointer">
                            {m.bonRef}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- Entrée de marchandise dialog ---- */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entrée de marchandise</DialogTitle>
            <DialogDescription className="sr-only">
              Enregistrer une entrée de stock et mettre à jour la quantité
              disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="entry-marchandise"
                className="text-sm font-medium text-slate-700"
              >
                Marchandise
              </Label>
              <Select value={entryStockId} onValueChange={setEntryStockId}>
                <SelectTrigger id="entry-marchandise" className="w-full">
                  <SelectValue placeholder="Sélectionner une marchandise" />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.marchandise} (stock actuel : {s.quantite} {s.unite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="entry-qty"
                className="text-sm font-medium text-slate-700"
              >
                Quantité à entrer
              </Label>
              <Input
                id="entry-qty"
                type="number"
                min={1}
                value={entryQty}
                onChange={(e) => setEntryQty(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="entry-resp"
                className="text-sm font-medium text-slate-700"
              >
                Responsable
              </Label>
              <Input
                id="entry-resp"
                value={entryResp}
                onChange={(e) => setEntryResp(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEntryOpen(false)}
            >
              Annuler
            </Button>
            <Button type="button" onClick={submitEntry} disabled={entryDisabled}>
              Valider l&apos;entrée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Sortie de marchandise dialog ---- */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sortie de marchandise</DialogTitle>
            <DialogDescription className="sr-only">
              Enregistrer une sortie de stock et décrémenter la quantité
              disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="exit-marchandise"
                className="text-sm font-medium text-slate-700"
              >
                Marchandise
              </Label>
              <Select value={exitStockId} onValueChange={setExitStockId}>
                <SelectTrigger id="exit-marchandise" className="w-full">
                  <SelectValue placeholder="Sélectionner une marchandise" />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.marchandise} (stock actuel : {s.quantite} {s.unite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="exit-qty"
                className="text-sm font-medium text-slate-700"
              >
                Quantité à sortir
              </Label>
              <Input
                id="exit-qty"
                type="number"
                min={1}
                value={exitQty}
                onChange={(e) => setExitQty(e.target.value)}
                aria-invalid={exitOverflow}
              />
              {exitOverflow && (
                <p className="text-xs text-red-600">
                  La quantité dépasse le stock disponible ({exitStock?.quantite}{" "}
                  {exitStock?.unite}).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="exit-resp"
                className="text-sm font-medium text-slate-700"
              >
                Responsable
              </Label>
              <Input
                id="exit-resp"
                value={exitResp}
                onChange={(e) => setExitResp(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="exit-motif"
                className="text-sm font-medium text-slate-700"
              >
                Motif
              </Label>
              <Select
                value={exitMotif}
                onValueChange={(v) => setExitMotif(v as SortieMotif)}
              >
                <SelectTrigger id="exit-motif" className="w-full">
                  <SelectValue />
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExitOpen(false)}
            >
              Annuler
            </Button>
            <Button type="button" onClick={submitExit} disabled={exitDisabled}>
              Valider la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockRow({
  item,
  onEntry,
  onExit,
  onHistory,
}: {
  item: StockItem;
  onEntry: (id: string) => void;
  onExit: (id: string) => void;
  onHistory: (marchandise: string) => void;
}) {
  const faible = item.quantite < item.seuil;
  const statut = faible ? "Stock faible" : "Disponible";

  return (
    <TableRow
      className={
        "border-b border-border hover:bg-slate-50/60 " +
        (faible ? "bg-red-50/40" : "")
      }
    >
      <TableCell className="font-medium text-slate-900">
        <span className="flex items-center gap-1.5">
          {faible && (
            <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
          )}
          {item.marchandise}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums text-slate-900">
        {item.quantite} {item.unite}
      </TableCell>
      <TableCell className="text-slate-600">{item.unite}</TableCell>
      <TableCell className="text-slate-600">{item.depositaire}</TableCell>
      <TableCell className="text-slate-600">{item.commercial}</TableCell>
      <TableCell className="text-right tabular-nums text-slate-700">
        {formatFCFA(item.sommePayee)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-amber-600">
        {formatFCFA(item.resteAPayer)}
      </TableCell>
      <TableCell>
        <StockStatutBadge statut={statut} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Entrée de marchandise"
            onClick={() => onEntry(item.id)}
          >
            <PackagePlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            aria-label="Sortie de marchandise"
            onClick={() => onExit(item.id)}
          >
            <PackageMinus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Historique"
            onClick={() => onHistory(item.marchandise)}
          >
            <History className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
