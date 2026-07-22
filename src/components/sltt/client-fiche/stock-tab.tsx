"use client";

import { Warehouse } from "lucide-react";
import type { Mouvement, StockItem } from "@/lib/domain-types";
import { formatFCFA } from "@/lib/format";
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

type StockTabProps = {
  stockItems: StockItem[];
  clientMouvements: Mouvement[];
  onOpenEntreposage: () => void;
};

export function StockTab({ stockItems, clientMouvements, onOpenEntreposage }: StockTabProps) {
  return (
    <TabsContent value="stock" className="mt-6 focus-visible:outline-none">
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        {stockItems.length === 0 ? (
          <TabEmptyState
            label="Aucun article de stock rattaché à ce client."
            action={
              <Button size="sm" variant="outline" onClick={onOpenEntreposage}>
                <Warehouse className="size-4" />
                Ouvrir l&apos;entreposage
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {stockItems.map((item) => (
                <Card key={item.id} className="border-border/80 p-4 shadow-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{item.marchandise}</p>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Quantité</dt>
                      <dd className="tabular-nums text-slate-700 dark:text-slate-300">
                        {item.quantite} {item.unite}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Dépositaire</dt>
                      <dd className="text-slate-700 dark:text-slate-300">{item.depositaire}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Commercial</dt>
                      <dd className="text-slate-700 dark:text-slate-300">{item.commercial}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Payé</dt>
                      <dd className="tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatFCFA(item.sommePayee)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-slate-500">Reste</dt>
                      <dd className="tabular-nums text-amber-700 dark:text-amber-400">
                        {formatFCFA(item.resteAPayer)}
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
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Marchandise
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Qté
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">
                      Dépositaire
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                      Commercial
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Payé
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Reste
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-border">
                      <TableCell className="px-4 py-3.5 font-medium">{item.marchandise}</TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums">
                        {item.quantite} {item.unite}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 sm:table-cell">{item.depositaire}</TableCell>
                      <TableCell className="hidden px-4 py-3.5 md:table-cell">{item.commercial}</TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums text-emerald-700">
                        {formatFCFA(item.sommePayee)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums text-amber-700">
                        {formatFCFA(item.resteAPayer)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {clientMouvements.length > 0 && (
              <div className="border-t border-border px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Derniers mouvements
                </p>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {clientMouvements.slice(0, 5).map((m) => (
                    <li key={m.id} className="flex justify-between gap-2">
                      <span>
                        {m.type} — {m.marchandise}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {m.quantite} {m.unite}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>
    </TabsContent>
  );
}
