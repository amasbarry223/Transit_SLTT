"use client";

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
import type { BonSortie } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EmptyState } from "@/components/sltt/empty-state";
import { ToneBadge } from "@/components/sltt/status-badge";
import { SocieteFilterSelect, SocieteBadge } from "@/components/sltt/societe-filter-select";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";
import {
  BON_MOTIFS,
  BON_MOTIF_TONE,
  BON_STATUT_TONE,
  useBonFilters,
} from "./use-bon-filters";

type BonMarchandiseTabProps = {
  bons: BonSortie[];
  canWrite: boolean;
  validatingIds: Set<string>;
  onOpenCreateDialog: () => void;
  onConfirmValidate: (payload: { id: string; ref: string }) => void;
  onView: (reference: string) => void;
  onPrint: (reference: string) => void;
};

export function BonMarchandiseTab({
  bons,
  canWrite,
  validatingIds,
  onOpenCreateDialog,
  onConfirmValidate,
  onView,
  onPrint,
}: BonMarchandiseTabProps) {
  const clients = useStore((state) => state.clients);
  const filters = useBonFilters(bons);

  return (
    <TabsContent value="marchandise" className="mt-0 space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total bons"
          value={String(filters.stats.total)}
          icon={ClipboardList}
          tone="blue"
          sublabel="bons enregistrés"
        />
        <KpiCard
          label="Validés"
          value={String(filters.stats.valides)}
          icon={CheckCircle2}
          tone="emerald"
          sublabel="sorties confirmées"
        />
        <KpiCard
          label="Brouillons"
          value={String(filters.stats.brouillons)}
          icon={FilePen}
          tone="amber"
          sublabel="en attente de validation"
        />
        <KpiCard
          label="Montant total"
          value={formatFCFA(filters.stats.montantTotal)}
          icon={Wallet}
          tone="indigo"
          sublabel="valeur des sorties"
        />
      </div>

      {filters.stats.brouillons > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3">
          <FilePen className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {filters.stats.brouillons} bon{filters.stats.brouillons > 1 ? "s" : ""} en brouillon
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
              value={filters.search}
              onChange={(event) => filters.updateSearch(event.target.value)}
              className="h-10 pl-9"
              aria-label="Rechercher un bon"
            />
          </div>

          <Select value={filters.clientFilter} onValueChange={filters.updateClientFilter}>
            <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Filtrer par client">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.motifFilter} onValueChange={filters.updateMotifFilter}>
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par motif">
              <SelectValue placeholder="Motif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les motifs</SelectItem>
              {BON_MOTIFS.map((motif) => (
                <SelectItem key={motif} value={motif}>
                  {motif}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.statutFilter} onValueChange={filters.updateStatutFilter}>
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
            value={filters.dateFilter}
            onChange={(event) => filters.updateDateFilter(event.target.value)}
            className="h-10 w-full sm:w-40"
            aria-label="Filtrer par date"
          />

          <SocieteFilterSelect className="w-full sm:w-44" />

          {filters.hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500 dark:text-slate-400"
              onClick={filters.clearFilters}
            >
              Réinitialiser
            </Button>
          )}

          <p className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {filters.filtered.length} bon{filters.filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Truck className="size-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Liste des bons de sortie</h2>
        </div>

        {filters.filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucun bon trouvé"
            description={
              filters.hasActiveFilters
                ? "Modifiez vos filtres ou créez un nouveau bon de sortie."
                : "Enregistrez votre premier bon pour tracer une sortie de marchandise."
            }
            action={
              !filters.hasActiveFilters && canWrite ? (
                <Button onClick={onOpenCreateDialog}>
                  <Plus className="size-4" />
                  Nouveau bon de sortie
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {filters.paged.map((bon) => (
                <BonMobileCard
                  key={bon.id}
                  bon={bon}
                  canWrite={canWrite}
                  validatingIds={validatingIds}
                  onConfirmValidate={onConfirmValidate}
                  onView={onView}
                  onPrint={onPrint}
                />
              ))}
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
                  {filters.paged.map((bon) => (
                    <BonTableRow
                      key={bon.id}
                      bon={bon}
                      canWrite={canWrite}
                      validatingIds={validatingIds}
                      onConfirmValidate={onConfirmValidate}
                      onView={onView}
                      onPrint={onPrint}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              startIdx={filters.startIdx}
              endIdx={filters.endIdx}
              totalItems={filters.filtered.length}
              itemLabel={`bon${filters.filtered.length !== 1 ? "s" : ""}`}
              page={filters.page}
              totalPages={filters.totalPages}
              onPageChange={filters.setPage}
            />
          </>
        )}
      </Card>
    </TabsContent>
  );
}

function BonMobileCard({
  bon,
  canWrite,
  validatingIds,
  onConfirmValidate,
  onView,
  onPrint,
}: {
  bon: BonSortie;
  canWrite: boolean;
  validatingIds: Set<string>;
  onConfirmValidate: (payload: { id: string; ref: string }) => void;
  onView: (reference: string) => void;
  onPrint: (reference: string) => void;
}) {
  const isBrouillon = bon.statut === "Brouillon";

  return (
    <Card
      className={cn("border-border/80 p-4 shadow-sm", isBrouillon && "bg-amber-50/25 dark:bg-amber-950/20")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{bon.reference}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{bon.clientNom}</p>
        </div>
        <ToneBadge tone={BON_STATUT_TONE[bon.statut]}>{bon.statut}</ToneBadge>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Date</dt>
          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(bon.date)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Société</dt>
          <dd>
            <SocieteBadge societeNom={bon.societeNom} size="sm" />
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Marchandise</dt>
          <dd className="truncate text-right text-slate-700 dark:text-slate-300">{bon.marchandise}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Motif</dt>
          <dd>
            <ToneBadge tone={BON_MOTIF_TONE[bon.motif]}>{bon.motif}</ToneBadge>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Quantité</dt>
          <dd className="tabular-nums text-slate-700 dark:text-slate-300">
            {bon.quantite} {bon.unite}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-slate-500">Montant</dt>
          <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatFCFA(bon.montant)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
        {isBrouillon && canWrite && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-amber-600 dark:text-amber-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            aria-label={`Valider ${bon.reference}`}
            title="Valider le bon"
            disabled={validatingIds.has(bon.id)}
            onClick={() => onConfirmValidate({ id: bon.id, ref: bon.reference })}
          >
            <Check className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-slate-500 dark:text-slate-400 hover:text-primary"
          aria-label={`Visualiser ${bon.reference}`}
          title="Visualiser"
          onClick={() => onView(bon.reference)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-slate-500 dark:text-slate-400 hover:text-primary"
          aria-label={`Imprimer ${bon.reference}`}
          title="PDF / Imprimer"
          onClick={() => onPrint(bon.reference)}
        >
          <FileText className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

function BonTableRow({
  bon,
  canWrite,
  validatingIds,
  onConfirmValidate,
  onView,
  onPrint,
}: {
  bon: BonSortie;
  canWrite: boolean;
  validatingIds: Set<string>;
  onConfirmValidate: (payload: { id: string; ref: string }) => void;
  onView: (reference: string) => void;
  onPrint: (reference: string) => void;
}) {
  const isBrouillon = bon.statut === "Brouillon";

  return (
    <TableRow
      className={cn(
        "border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60",
        isBrouillon && "bg-amber-50/25 dark:bg-amber-950/20",
      )}
    >
      <TableCell className="px-4 py-3.5">
        <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{bon.reference}</p>
        <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400 sm:hidden">
          {formatDateShort(bon.date)}
        </p>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300 sm:table-cell">
        {formatDateShort(bon.date)}
      </TableCell>
      <TableCell className="max-w-[160px] px-4 py-3.5">
        <p className="truncate font-medium text-slate-700 dark:text-slate-300">{bon.clientNom}</p>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 sm:table-cell">
        <SocieteBadge societeNom={bon.societeNom} size="sm" />
      </TableCell>
      <TableCell className="hidden max-w-[140px] px-4 py-3.5 md:table-cell">
        <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <Package className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="truncate">{bon.marchandise}</span>
        </span>
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <ToneBadge tone={BON_MOTIF_TONE[bon.motif]}>{bon.motif}</ToneBadge>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
        {bon.quantite} <span className="text-xs text-slate-500 dark:text-slate-400">{bon.unite}</span>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100 sm:table-cell">
        {formatFCFA(bon.montant)}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <ToneBadge tone={BON_STATUT_TONE[bon.statut]}>{bon.statut}</ToneBadge>
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          {isBrouillon && canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-amber-600 dark:text-amber-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              aria-label={`Valider ${bon.reference}`}
              title="Valider le bon"
              disabled={validatingIds.has(bon.id)}
              onClick={() => onConfirmValidate({ id: bon.id, ref: bon.reference })}
            >
              <Check className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-slate-500 dark:text-slate-400 hover:text-primary"
            aria-label={`Visualiser ${bon.reference}`}
            title="Visualiser"
            onClick={() => onView(bon.reference)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-slate-500 dark:text-slate-400 hover:text-primary"
            aria-label={`Imprimer ${bon.reference}`}
            title="PDF / Imprimer"
            onClick={() => onPrint(bon.reference)}
          >
            <FileText className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
