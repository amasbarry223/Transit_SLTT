"use client";

import { Plus } from "lucide-react";
import type { Facture } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { FactureStatutBadge } from "@/components/sltt/status-badge";
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
import { TabEmptyState } from "./shared";

type FacturesTabProps = {
  factures: Facture[];
  onNewFacture: () => void;
  onOpenFacture: (id: string) => void;
};

export function FacturesTab({ factures, onNewFacture, onOpenFacture }: FacturesTabProps) {
  return (
    <TabsContent value="factures" className="mt-6 space-y-3 focus-visible:outline-none">
      <div className="flex justify-end">
        <Button size="sm" onClick={onNewFacture}>
          <Plus className="size-4" />
          Nouvelle facture
        </Button>
      </div>
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        {factures.length === 0 ? (
          <TabEmptyState label="Aucune facture pour ce client." />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {factures.map((f) => (
                <Card
                  key={f.id}
                  className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
                  onClick={() => onOpenFacture(f.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-semibold text-blue-700">{f.numero}</p>
                    <FactureStatutBadge statut={f.statut} />
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Date</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                        {formatDateShort(f.date)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Montant TTC</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                        {formatFCFA(f.montantTTC)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Payé</dt>
                      <dd className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                        {formatFCFA(f.montantPaye)}
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
                      Numéro
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                      Montant TTC
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                      Payé
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factures.map((f) => (
                    <TableRow
                      key={f.id}
                      className="cursor-pointer border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                      onClick={() => onOpenFacture(f.id)}
                    >
                      <TableCell className="px-4 py-3.5 font-mono text-xs font-semibold text-blue-700">
                        {f.numero}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                        {formatDateShort(f.date)}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 sm:table-cell">
                        {formatFCFA(f.montantTTC)}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-emerald-700 md:table-cell">
                        {formatFCFA(f.montantPaye)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <FactureStatutBadge statut={f.statut} />
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
  );
}
