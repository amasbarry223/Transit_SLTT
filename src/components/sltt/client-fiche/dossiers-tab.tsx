"use client";

import { Plus, Eye } from "lucide-react";
import type { Dossier } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { DossierStatutBadge } from "@/components/sltt/status-badge";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { PAGE_SIZE, TabEmptyState } from "./shared";

type DossiersTabProps = {
  dossiers: Dossier[];
  pagedDossiers: Dossier[];
  dossierSafePage: number;
  dossierPages: number;
  onPageChange: (page: number) => void;
  onOpenDossier: (id: string) => void;
  onCreateDossier: () => void;
};

export function DossiersTab({
  dossiers,
  pagedDossiers,
  dossierSafePage,
  dossierPages,
  onPageChange,
  onOpenDossier,
  onCreateDossier,
}: DossiersTabProps) {
  return (
    <TabsContent value="dossiers" className="mt-6 focus-visible:outline-none">
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        {dossiers.length === 0 ? (
          <TabEmptyState
            label="Aucun dossier pour ce client."
            action={
              <Button size="sm" onClick={onCreateDossier}>
                <Plus className="size-4" />
                Créer un dossier
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {pagedDossiers.map((d) => (
                <Card
                  key={d.id}
                  className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
                  onClick={() => onOpenDossier(d.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{d.reference}</p>
                    <DossierStatutBadge statut={d.statut} />
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Date</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                        {formatDateShort(d.date)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Montant</dt>
                      <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {formatFCFA(d.montantInvesti)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Référence
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      N° BL
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Statut
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
                  {pagedDossiers.map((d) => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer border-b border-border hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                      onClick={() => onOpenDossier(d.id)}
                    >
                      <TableCell className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        {d.reference}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300 sm:table-cell">
                        {formatDateShort(d.date)}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 md:table-cell">
                        {d.bl}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <DossierStatutBadge statut={d.statut} />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {formatFCFA(d.montantInvesti)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-500 hover:text-primary dark:text-slate-400"
                            aria-label={`Voir ${d.reference}`}
                            title="Voir le dossier"
                            onClick={() => onOpenDossier(d.id)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              startIdx={dossiers.length === 0 ? 0 : (dossierSafePage - 1) * PAGE_SIZE + 1}
              endIdx={Math.min(dossierSafePage * PAGE_SIZE, dossiers.length)}
              totalItems={dossiers.length}
              page={dossierSafePage}
              totalPages={dossierPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </Card>
    </TabsContent>
  );
}
