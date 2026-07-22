"use client";

import { useMemo, useState } from "react";
import { Plus, FileText, Search, Banknote, Wallet, Trash2 } from "lucide-react";
import type { BonSortieCaisse } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { printBonSortieCaisseModule } from "@/lib/export";
import { KpiCard } from "@/components/sltt/kpi-card";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";

type BonCaisseTabProps = {
  canWriteCaisse: boolean;
  onOpenCreateDialog: () => void;
};

function beneficiairesSummary(bon: BonSortieCaisse): string {
  if (bon.lignes.length === 0) return "—";
  const first = bon.lignes[0].beneficiaire;
  return bon.lignes.length > 1 ? `${first} +${bon.lignes.length - 1}` : first;
}

export function BonCaisseTab({ canWriteCaisse, onOpenCreateDialog }: BonCaisseTabProps) {
  const { toast } = useToast();
  const bonsSortieCaisse = useStore((state) => state.bonsSortieCaisse);
  const removeBonSortieCaisse = useStore((state) => state.removeBonSortieCaisse);
  const societes = useStore((state) => state.societes);

  const [caisseSearch, setCaisseSearch] = useState("");

  const { target: caisseDeleteTarget, setTarget: setCaisseDeleteTarget, confirm: handleDeleteCaisse } =
    useDeleteConfirm<BonSortieCaisse>(
      removeBonSortieCaisse,
      (bon) => bon.id,
      (bon) => bon.reference,
      "Bon supprimé",
      "Impossible de supprimer le bon.",
    );

  const caisseStats = useMemo(
    () => ({
      total: bonsSortieCaisse.length,
      montantTotal: bonsSortieCaisse.reduce((sum, bon) => sum + bon.montantTotal, 0),
    }),
    [bonsSortieCaisse],
  );

  const filteredCaisse = useMemo(() => {
    const query = caisseSearch.trim().toLowerCase();
    if (!query) return bonsSortieCaisse;
    return bonsSortieCaisse.filter(
      (bon) =>
        bon.reference.toLowerCase().includes(query) ||
        bon.lignes.some(
          (ligne) =>
            ligne.beneficiaire.toLowerCase().includes(query) || ligne.motif.toLowerCase().includes(query),
        ),
    );
  }, [bonsSortieCaisse, caisseSearch]);

  function handlePrintCaisse(bon: BonSortieCaisse) {
    const societe = societes.find((item) => item.id === bon.societeId);
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
      signataireDg: societe?.signataireDg,
      signatairePdg: societe?.signatairePdg,
    });
  }

  function handlePrintCaisseWithToast(bon: BonSortieCaisse) {
    handlePrintCaisse(bon);
    toast({
      title: "Bon prêt à imprimer",
      description: `${bon.reference} — ${formatFCFA(bon.montantTotal)}.`,
    });
  }

  return (
    <>
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
                onChange={(event) => setCaisseSearch(event.target.value)}
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
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sorties de caisse</h2>
          </div>

          {filteredCaisse.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Banknote className="size-7" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Aucune sortie de caisse</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {caisseSearch
                  ? "Modifiez votre recherche ou enregistrez une nouvelle sortie."
                  : "Enregistrez un décaissement (honoraires, frais divers…)."}
              </p>
              {!caisseSearch && canWriteCaisse && (
                <Button className="mt-5" onClick={onOpenCreateDialog}>
                  <Plus className="size-4" />
                  Nouvelle sortie de caisse
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredCaisse.map((bon) => (
                  <CaisseMobileCard
                    key={bon.id}
                    bon={bon}
                    canWriteCaisse={canWriteCaisse}
                    onPrint={handlePrintCaisseWithToast}
                    onDelete={setCaisseDeleteTarget}
                  />
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
                    {filteredCaisse.map((bon) => (
                      <CaisseTableRow
                        key={bon.id}
                        bon={bon}
                        canWriteCaisse={canWriteCaisse}
                        onPrint={handlePrintCaisseWithToast}
                        onDelete={setCaisseDeleteTarget}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </TabsContent>

      <ConfirmDeleteDialog
        open={!!caisseDeleteTarget}
        onOpenChange={(open) => !open && setCaisseDeleteTarget(null)}
        title="Supprimer ce bon de sortie ?"
        description="Cette action est irréversible. Le bon et ses lignes seront définitivement supprimés."
        onConfirm={handleDeleteCaisse}
      />
    </>
  );
}

function CaisseMobileCard({
  bon,
  canWriteCaisse,
  onPrint,
  onDelete,
}: {
  bon: BonSortieCaisse;
  canWriteCaisse: boolean;
  onPrint: (bon: BonSortieCaisse) => void;
  onDelete: (bon: BonSortieCaisse) => void;
}) {
  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{bon.reference}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
            {beneficiairesSummary(bon)}
          </p>
        </div>
        <SocieteBadge societeNom={bon.societeNom} size="sm" />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Date</dt>
          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(bon.date)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Motif</dt>
          <dd className="truncate text-right text-slate-700 dark:text-slate-300">
            {bon.lignes.map((ligne) => ligne.motif).join(", ")}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Montant</dt>
          <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatFCFA(bon.montantTotal)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-slate-500 dark:text-slate-400 hover:text-primary"
          aria-label={`Imprimer ${bon.reference}`}
          title="PDF / Imprimer"
          onClick={() => onPrint(bon)}
        >
          <FileText className="size-4" />
        </Button>
        {canWriteCaisse && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-slate-400 hover:text-red-600"
            aria-label={`Supprimer ${bon.reference}`}
            title="Supprimer"
            onClick={() => onDelete(bon)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function CaisseTableRow({
  bon,
  canWriteCaisse,
  onPrint,
  onDelete,
}: {
  bon: BonSortieCaisse;
  canWriteCaisse: boolean;
  onPrint: (bon: BonSortieCaisse) => void;
  onDelete: (bon: BonSortieCaisse) => void;
}) {
  return (
    <TableRow className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
      <TableCell className="px-4 py-3.5">
        <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{bon.reference}</p>
      </TableCell>
      <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
        {formatDateShort(bon.date)}
      </TableCell>
      <TableCell className="max-w-[180px] px-4 py-3.5">
        <p className="truncate font-medium text-slate-700 dark:text-slate-300">{beneficiairesSummary(bon)}</p>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 md:table-cell">
        <SocieteBadge societeNom={bon.societeNom} size="sm" />
      </TableCell>
      <TableCell className="hidden max-w-[200px] px-4 py-3.5 md:table-cell">
        <p className="truncate text-sm text-slate-600 dark:text-slate-300">
          {bon.lignes.map((ligne) => ligne.motif).join(", ")}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
        {formatFCFA(bon.montantTotal)}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-slate-500 dark:text-slate-400 hover:text-primary"
            aria-label={`Imprimer ${bon.reference}`}
            title="PDF / Imprimer"
            onClick={() => onPrint(bon)}
          >
            <FileText className="size-4" />
          </Button>
          {canWriteCaisse && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-slate-400 hover:text-red-600"
              aria-label={`Supprimer ${bon.reference}`}
              title="Supprimer"
              onClick={() => onDelete(bon)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
