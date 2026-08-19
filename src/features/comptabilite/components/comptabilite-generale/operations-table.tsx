import { memo } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import type { OperationComptable } from "@/lib/domain-types";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/sltt/empty-state";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SOURCE_LABEL: Record<OperationComptable["source"], string> = {
  saisie: "Saisie manuelle",
  import_excel: "Import Excel",
  import_ocr: "Import OCR",
};

interface OperationsTableProps {
  operations: OperationComptable[];
  ecartCumuleById: Map<string, number>;
  ecartClientCumuleById?: Map<string, number>;
  totalItems: number;
  hasActiveFilters: boolean;
  canWrite: boolean;
  showQuantitePrixUnitaire: boolean;
  startIdx: number;
  endIdx: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDelete: (operation: OperationComptable) => void;
  onCreate: () => void;
}

interface OperationRowProps {
  operation: OperationComptable;
  ecartCumuleById: Map<string, number>;
  ecartClientCumuleById?: Map<string, number>;
  canWrite: boolean;
  showQuantitePrixUnitaire: boolean;
  onDelete: (operation: OperationComptable) => void;
}

const OperationMobileCard = memo(function OperationMobileCard({
  operation: o,
  ecartClientCumuleById,
  canWrite,
  showQuantitePrixUnitaire,
  onDelete,
}: OperationRowProps) {
  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-medium text-foreground">{o.clientNom}</p>
            {o.dossierRef && (
              <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {o.dossierRef}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{formatDateShort(o.date)} · {o.nature}</p>
        </div>
        <span className={cn("text-sm font-semibold tabular-nums", o.type === "Entrée" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
          {o.type === "Entrée" ? "+" : "-"}{formatFCFA(o.montant)}
        </span>
      </div>
      {showQuantitePrixUnitaire && o.quantite != null && o.prixUnitaire != null && (
        <p className="mt-2 text-xs text-muted-foreground">{o.quantite} × {formatFCFA(o.prixUnitaire)}</p>
      )}
      {ecartClientCumuleById?.has(o.id) && (
        <p className="mt-2 text-xs text-muted-foreground">
          Écart Client :{" "}
          <span className={cn("font-medium tabular-nums", (ecartClientCumuleById.get(o.id) ?? 0) >= 0 ? "text-foreground/90" : "text-red-600 dark:text-red-400")}>
            {formatFCFA(ecartClientCumuleById.get(o.id) ?? 0)}
          </span>
        </p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal">{SOURCE_LABEL[o.source]}</Badge>
          {o.modePaiement && <Badge variant="secondary" className="text-xs font-normal">{o.modePaiement}</Badge>}
        </div>
        {canWrite && (
          <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" onClick={() => onDelete(o)} aria-label="Supprimer">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </Card>
  );
});

const OperationTableRow = memo(function OperationTableRow({
  operation: o,
  ecartCumuleById,
  ecartClientCumuleById,
  canWrite,
  showQuantitePrixUnitaire,
  onDelete,
}: OperationRowProps) {
  return (
    <TableRow className="border-b border-border hover:bg-muted/60">
      <TableCell className="px-4 py-3.5 tabular-nums text-muted-foreground">{formatDateShort(o.date)}</TableCell>
      <TableCell className="px-4 py-3.5">
        <p className="font-medium text-foreground">{o.clientNom}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{o.reference}</p>
      </TableCell>
      <TableCell className="px-4 py-3.5">
        {o.dossierRef ? (
          <Badge variant="secondary" className="font-mono text-[11px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            {o.dossierRef}
          </Badge>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-muted-foreground">{o.nature}</TableCell>
      <TableCell className="px-4 py-3.5 text-xs text-slate-500">{o.modePaiement || "Espèces"}</TableCell>
      {showQuantitePrixUnitaire && (
        <TableCell className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
          {o.quantite != null && o.prixUnitaire != null ? `${o.quantite} × ${formatFCFA(o.prixUnitaire)}` : "—"}
        </TableCell>
      )}
      <TableCell className="px-4 py-3.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
        {o.type === "Entrée" ? formatFCFA(o.montant) : "—"}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right tabular-nums text-amber-600 dark:text-amber-400 font-medium">
        {o.type === "Sortie" ? formatFCFA(o.montant) : "—"}
      </TableCell>
      <TableCell
        className={cn(
          "px-4 py-3.5 text-right tabular-nums font-semibold",
          ((ecartClientCumuleById?.get(o.id) ?? ecartCumuleById.get(o.id) ?? 0)) >= 0 ? "text-foreground/90" : "text-red-600 dark:text-red-400",
        )}
      >
        {formatFCFA(ecartClientCumuleById?.get(o.id) ?? ecartCumuleById.get(o.id) ?? 0)}
      </TableCell>
      <TableCell className="px-4 py-3.5"><Badge variant="outline" className="text-xs font-normal">{SOURCE_LABEL[o.source]}</Badge></TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end">
          {canWrite && (
            <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" onClick={() => onDelete(o)} aria-label={`Supprimer l'opération ${o.reference}`} title="Supprimer">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

export function OperationsTable({
  operations,
  ecartCumuleById,
  ecartClientCumuleById,
  totalItems,
  hasActiveFilters,
  canWrite,
  showQuantitePrixUnitaire,
  startIdx,
  endIdx,
  page,
  totalPages,
  onPageChange,
  onDelete,
  onCreate,
}: OperationsTableProps) {
  return (
    <Card className="border-border/80 gap-0 overflow-hidden p-0 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Wallet className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Journal unique des opérations</h2>
      </div>
      {totalItems === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Aucune opération trouvée"
          description={hasActiveFilters
            ? "Modifiez vos filtres ou saisissez une nouvelle opération."
            : "Commencez par saisir la première opération de cette entité."}
          action={!hasActiveFilters && canWrite ? (
            <Button onClick={onCreate}><Plus className="size-4" />Nouvelle opération</Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {operations.map((o) => (
              <OperationMobileCard
                key={o.id}
                operation={o}
                ecartCumuleById={ecartCumuleById}
                ecartClientCumuleById={ecartClientCumuleById}
                canWrite={canWrite}
                showQuantitePrixUnitaire={showQuantitePrixUnitaire}
                onDelete={onDelete}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-slate-50 hover:bg-muted/50 hover:bg-muted">
                  <Heading>Date</Heading>
                  <Heading>Client / Tiers</Heading>
                  <Heading>Dossier</Heading>
                  <Heading>Nature</Heading>
                  <Heading>Mode</Heading>
                  {showQuantitePrixUnitaire && <Heading className="text-right">Qté × PU</Heading>}
                  <Heading className="text-right">Entrée</Heading>
                  <Heading className="text-right">Sortie</Heading>
                  <Heading className="text-right">Écart Client</Heading>
                  <Heading>Source</Heading>
                  <Heading className="text-right">Actions</Heading>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((o) => (
                  <OperationTableRow
                    key={o.id}
                    operation={o}
                    ecartCumuleById={ecartCumuleById}
                    ecartClientCumuleById={ecartClientCumuleById}
                    canWrite={canWrite}
                    showQuantitePrixUnitaire={showQuantitePrixUnitaire}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            startIdx={startIdx}
            endIdx={endIdx}
            totalItems={totalItems}
            itemLabel={`opération${totalItems !== 1 ? "s" : ""}`}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </Card>
  );
}

function Heading({ className, children }: { className?: string; children: React.ReactNode }) {
  return <TableHead className={cn("h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground", className)}>{children}</TableHead>;
}
