"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { useStore, type Ecriture, type PaiementMode } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EcritureStatutBadge, EcartValue } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export function ComptabiliteScreen() {
  const { toast } = useToast();
  const ecritures = useStore((s) => s.ecritures);
  const recordPayment = useStore((s) => s.recordPayment);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Ecriture | null>(null);
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState<PaiementMode>("Virement");
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");

  const totalInvesti = useMemo(
    () => ecritures.reduce((s, e) => s + e.montantInvesti, 0),
    [ecritures],
  );
  const totalPaye = useMemo(
    () => ecritures.reduce((s, e) => s + e.montantPaye, 0),
    [ecritures],
  );
  const totalDu = totalInvesti - totalPaye;

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
    recordPayment(selected.id, montantNum, mode, datePaiement, note);
    toast({
      title: "Paiement enregistré",
      description: "Le solde a été mis à jour.",
    });
    setOpen(false);
    setSelected(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptabilité"
        description="Suivi des écritures et des paiements"
      >
        <Button>
          <Plus className="size-4" />
          Nouvelle écriture
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard
          label="Total investi"
          value={formatFCFA(totalInvesti)}
          icon={TrendingUp}
          tone="blue"
          sublabel="Cumul des dossiers"
        />
        <KpiCard
          label="Total encaissé"
          value={formatFCFA(totalPaye)}
          icon={Wallet}
          tone="emerald"
          variation={12}
          variationLabel="vs période préc."
        />
        <KpiCard
          label="Total dû"
          value={formatFCFA(totalDu)}
          icon={Clock}
          tone="amber"
          sublabel="Restes à encaisser"
        />
      </div>

      {/* Entries table */}
      <Card className="p-5 shadow-sm border-border/80 gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">
            Écritures comptables
          </h2>
          <Badge
            variant="secondary"
            className="rounded-full bg-slate-100 text-slate-600 border-slate-200"
          >
            {ecritures.length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                Date
              </TableHead>
              <TableHead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                Client
              </TableHead>
              <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                Montant investi
              </TableHead>
              <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                Montant payé
              </TableHead>
              <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                Reste à payer
              </TableHead>
              <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                Écart
              </TableHead>
              <TableHead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                Mode
              </TableHead>
              <TableHead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                Statut
              </TableHead>
              <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ecritures.map((e) => {
              const reste = Math.max(0, e.montantInvesti - e.montantPaye);
              const ecart = e.montantPaye - e.montantInvesti;
              const ModeIcon = modeIcon[e.modePaiement];
              return (
                <TableRow
                  key={e.id}
                  className="border-b border-border hover:bg-slate-50/60"
                >
                  <TableCell className="tabular-nums text-slate-600">
                    {formatDateShort(e.date)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {e.clientNom}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700">
                    {formatFCFA(e.montantInvesti)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {formatFCFA(e.montantPaye)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-amber-600">
                    {formatFCFA(reste)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EcartValue value={ecart} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <ModeIcon className="size-3.5" />
                      {e.modePaiement}
                    </span>
                  </TableCell>
                  <TableCell>
                    {reste === 0 ? (
                      <EcritureStatutBadge statut="Soldé" />
                    ) : (
                      <EcritureStatutBadge statut="En attente" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {reste > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPanel(e)}
                      >
                        <HandCoins className="size-3.5" />
                        Enregistrer un paiement
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Payment side panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 sm:max-w-md p-0"
        >
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="text-base">
              Enregistrer un paiement
            </SheetTitle>
            {selected && (
              <SheetDescription>
                {selected.clientNom} · {selected.id}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {selected && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Montant investi</span>
                  <span className="font-medium tabular-nums text-slate-700">
                    {formatFCFA(selected.montantInvesti)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-slate-500">Déjà payé</span>
                  <span className="font-medium tabular-nums text-emerald-600">
                    {formatFCFA(selected.montantPaye)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Reste à payer</span>
                  <span className="font-semibold tabular-nums text-amber-600">
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
              <Label htmlFor="montant" className="text-sm font-medium text-slate-700">
                Montant
              </Label>
              <div className="relative">
                <Input
                  id="montant"
                  inputMode="numeric"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="pr-16 tabular-nums"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  FCFA
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Mode de paiement
              </Label>
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as PaiementMode)}
              >
                <SelectTrigger className="w-full">
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
              <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-medium text-slate-700">
                Note
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Référence, acompte, complément d'information…"
              />
            </div>
          </div>

          <SheetFooter className="flex flex-row gap-2 border-t border-border px-5 py-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button className="flex-1" onClick={valider}>
              <Wallet className="size-4" />
              Valider le paiement
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
