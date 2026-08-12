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

export function OperationsTable({
  operations,
  ecartCumuleById,
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
        <Wallet className="size-4 text-slate-400 dark:text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Journal des opérations</h2>
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
              <Card key={o.id} className="border-border/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{o.clientNom}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDateShort(o.date)} · {o.nature}</p>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums", o.type === "Entrée" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                    {o.type === "Entrée" ? "+" : "-"}{formatFCFA(o.montant)}
                  </span>
                </div>
                {showQuantitePrixUnitaire && o.quantite != null && o.prixUnitaire != null && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{o.quantite} × {formatFCFA(o.prixUnitaire)}</p>
                )}
                {ecartCumuleById.has(o.id) && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Écart cumulé :{" "}
                    <span className={cn("font-medium tabular-nums", (ecartCumuleById.get(o.id) ?? 0) >= 0 ? "text-slate-700 dark:text-slate-200" : "text-red-600 dark:text-red-400")}>
                      {formatFCFA(ecartCumuleById.get(o.id) ?? 0)}
                    </span>
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <Badge variant="outline" className="text-xs font-normal">{SOURCE_LABEL[o.source]}</Badge>
                  {canWrite && (
                    <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" onClick={() => onDelete(o)} aria-label="Supprimer">
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800">
                  <Heading>Date</Heading>
                  <Heading>Client / Tiers</Heading>
                  <Heading>Nature</Heading>
                  {showQuantitePrixUnitaire && <Heading className="text-right">Qté × PU</Heading>}
                  <Heading className="text-right">Entrée</Heading>
                  <Heading className="text-right">Sortie</Heading>
                  <Heading className="text-right">Écart cumulé</Heading>
                  <Heading>Source</Heading>
                  <Heading className="text-right">Actions</Heading>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((o) => (
                  <TableRow key={o.id} className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                    <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{formatDateShort(o.date)}</TableCell>
                    <TableCell className="px-4 py-3.5">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{o.clientNom}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">{o.reference}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{o.nature}</TableCell>
                    {showQuantitePrixUnitaire && (
                      <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                        {o.quantite != null && o.prixUnitaire != null ? `${o.quantite} × ${formatFCFA(o.prixUnitaire)}` : "—"}
                      </TableCell>
                    )}
                    <TableCell className="px-4 py-3.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {o.type === "Entrée" ? formatFCFA(o.montant) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right tabular-nums text-amber-600 dark:text-amber-400">
                      {o.type === "Sortie" ? formatFCFA(o.montant) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3.5 text-right tabular-nums",
                        (ecartCumuleById.get(o.id) ?? 0) >= 0 ? "text-slate-600 dark:text-slate-300" : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {ecartCumuleById.has(o.id) ? formatFCFA(ecartCumuleById.get(o.id) ?? 0) : "—"}
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
  return <TableHead className={cn("h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400", className)}>{children}</TableHead>;
}
