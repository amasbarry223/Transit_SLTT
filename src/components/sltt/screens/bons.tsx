"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Eye,
  FileText,
  Check,
  Search,
  Truck,
  X,
} from "lucide-react";

import {
  bonsSortie,
  clients,
  stock,
  type BonMotif,
  type StockItem,
} from "@/lib/mock-data";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // Filters
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("tous");
  const [motifFilter, setMotifFilter] = useState("tous");
  const [dateFilter, setDateFilter] = useState("");

  // Creation dialog
  const [open, setOpen] = useState(false);
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formClientId, setFormClientId] = useState("");
  const [formStockId, setFormStockId] = useState("");
  const [formQuantite, setFormQuantite] = useState<string>("");
  const [formMotif, setFormMotif] = useState<BonMotif | "">("");
  const [formMontant, setFormMontant] = useState<string>("");

  const filtered = useMemo(() => {
    return bonsSortie.filter((b) => {
      if (
        search &&
        !b.reference.toLowerCase().includes(search.toLowerCase()) &&
        !b.clientNom.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (clientFilter !== "tous" && b.clientId !== clientFilter) return false;
      if (motifFilter !== "tous" && b.motif !== motifFilter) return false;
      if (dateFilter && b.date !== dateFilter) return false;
      return true;
    });
  }, [search, clientFilter, motifFilter, dateFilter]);

  const selectedStock: StockItem | undefined = useMemo(
    () => stock.find((s) => s.id === formStockId),
    [formStockId],
  );
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === formClientId),
    [formClientId],
  );

  const quantiteNum = Number(formQuantite) || 0;
  const stockDisponible = selectedStock?.quantite ?? 0;
  const depasseStock =
    selectedStock !== undefined && quantiteNum > stockDisponible;
  const montantNum = Number(formMontant) || 0;

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
    toast({
      title: "Bon de sortie validé",
      description: "Bon de sortie validé — stock décrémenté.",
    });
    setOpen(false);
    resetForm();
  }

  function handleView(ref: string) {
    toast({
      title: "Visualisation",
      description: `Bon ${ref} (démo).`,
    });
  }

  function handlePrint(ref: string) {
    toast({
      title: "Impression / PDF",
      description: `Bon ${ref} — génération PDF (démo).`,
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

      {/* Filter bar */}
      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Référence, client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={motifFilter} onValueChange={setMotifFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Motif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les motifs</SelectItem>
              {motifs.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[180px]"
          />
        </div>
      </Card>

      {/* List table */}
      <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
              <TableHead className="text-xs uppercase text-slate-500 font-medium">
                Référence
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-500 font-medium">
                Date
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-500 font-medium">
                Client
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-500 font-medium">
                Motif
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                Quantité
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                Montant
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-500 font-medium">
                Statut
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-slate-500 py-10"
                >
                  Aucun bon de sortie trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow
                  key={b.id}
                  className="hover:bg-slate-50/60 border-b border-border"
                >
                  <TableCell className="font-mono text-xs text-slate-700">
                    {b.reference}
                  </TableCell>
                  <TableCell className="text-slate-600 tabular-nums">
                    {formatDateShort(b.date)}
                  </TableCell>
                  <TableCell className="text-slate-700">{b.clientNom}</TableCell>
                  <TableCell>
                    <ToneBadge tone={motifTone[b.motif]}>{b.motif}</ToneBadge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700">
                    {b.quantite} {b.unite}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-slate-900">
                    {formatFCFA(b.montant)}
                  </TableCell>
                  <TableCell>
                    <ToneBadge tone={statutTone[b.statut]}>{b.statut}</ToneBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Visualiser"
                        onClick={() => handleView(b.reference)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="PDF / Imprimer"
                        onClick={() => handlePrint(b.reference)}
                      >
                        <FileText className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Creation dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle>Nouveau bon de sortie</DialogTitle>
              <Badge
                variant="outline"
                className="font-mono text-xs text-slate-500 bg-slate-50 border-slate-200"
              >
                BS-2026-0052
              </Badge>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bs-date" className="text-sm text-slate-700">
                  Date
                </Label>
                <Input
                  id="bs-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-client" className="text-sm text-slate-700">
                  Client
                </Label>
                <Select
                  value={formClientId}
                  onValueChange={setFormClientId}
                >
                  <SelectTrigger id="bs-client" className="w-full">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-stock" className="text-sm text-slate-700">
                  Marchandise
                </Label>
                <Select
                  value={formStockId}
                  onValueChange={setFormStockId}
                >
                  <SelectTrigger id="bs-stock" className="w-full">
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
                <Label htmlFor="bs-quantite" className="text-sm text-slate-700">
                  Quantité à sortir
                </Label>
                <Input
                  id="bs-quantite"
                  type="number"
                  min={0}
                  value={formQuantite}
                  onChange={(e) => setFormQuantite(e.target.value)}
                  aria-invalid={depasseStock}
                  placeholder="0"
                />
                {depasseStock && selectedStock && (
                  <p className="text-sm text-red-600">
                    La quantité dépasse le stock disponible ({stockDisponible}{" "}
                    {selectedStock.unite}).
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bs-motif" className="text-sm text-slate-700">
                  Motif
                </Label>
                <Select
                  value={formMotif}
                  onValueChange={(v) => setFormMotif(v as BonMotif)}
                >
                  <SelectTrigger id="bs-motif" className="w-full">
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
                <Label htmlFor="bs-montant" className="text-sm text-slate-700">
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
                    className="pr-16"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="hidden md:block">
              <BonPreview
                reference="BS-2026-0052"
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="size-4" />
              Annuler
            </Button>
            <Button
              onClick={handleValider}
              disabled={depasseStock || !formClientId || !formStockId || !formMotif || quantiteNum <= 0}
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
      value: client || <span className="text-slate-400">À renseigner</span>,
    },
    {
      label: "Marchandise",
      value:
        marchandise || <span className="text-slate-400">À renseigner</span>,
    },
    {
      label: "Quantité",
      value: quantite > 0 ? `${quantite} ${unite || ""}`.trim() : "—",
    },
    {
      label: "Motif",
      value: motif || <span className="text-slate-400">À renseigner</span>,
    },
    {
      label: "Montant",
      value: montant > 0 ? formatFCFA(montant) : "—",
    },
  ];

  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-6 font-[var(--font-heading)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="size-5" />
        </div>
        <div>
          <p className="font-bold text-slate-900 leading-tight">SLTT</p>
          <p className="text-[11px] text-slate-500 leading-tight">
            Société Traoré de Logistique,
            <br />
            Transit et Transport
          </p>
        </div>
      </div>

      {/* Title */}
      <div className="my-5 text-center">
        <p className="text-lg font-bold tracking-tight text-slate-900">
          BON DE SORTIE
        </p>
        <p className="mt-1 font-mono text-xs text-slate-500">{reference}</p>
      </div>

      {/* Mini table */}
      <div className="overflow-hidden rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.label}
                className={
                  (i % 2 === 0 ? "bg-slate-50/50 " : "") +
                  "border-b border-slate-100 last:border-0"
                }
              >
                <td className="w-1/3 px-3 py-1.5 text-xs font-medium uppercase text-slate-500">
                  {r.label}
                </td>
                <td className="px-3 py-1.5 text-slate-800 tabular-nums">
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature */}
      <div className="mt-8 flex items-end justify-between">
        <div className="text-xs text-slate-500">
          Signature du responsable
        </div>
        <div className="text-xs text-slate-400">__________</div>
      </div>
    </div>
  );
}
