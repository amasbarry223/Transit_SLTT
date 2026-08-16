"use client";

import type { BonSortie } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { BON_MOTIF_TONE, PAGE_SIZE, TabEmptyState, bonStatutTone } from "./shared";

type BonsTabProps = {
  bons: BonSortie[];
  pagedBons: BonSortie[];
  bonSafePage: number;
  bonPages: number;
  onPageChange: (page: number) => void;
  embedded?: boolean;
};

export function BonsTab({
  bons,
  pagedBons,
  bonSafePage,
  bonPages,
  onPageChange,
  embedded,
}: BonsTabProps) {
  const content = (
      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        {bons.length === 0 ? (
          <TabEmptyState label="Aucun bon de sortie pour ce client." />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {pagedBons.map((b) => (
                <Card key={b.id} className="border-border/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-medium text-foreground">
                      {b.reference}
                    </p>
                    <ToneBadge tone={bonStatutTone(b.statut)}>{b.statut}</ToneBadge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Date</dt>
                      <dd className="tabular-nums text-foreground/90">
                        {formatDateShort(b.date)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Marchandise</dt>
                      <dd className="truncate text-right text-foreground/90">
                        {b.marchandise}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Quantité</dt>
                      <dd className="tabular-nums text-foreground/90">
                        {b.quantite} {b.unite}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Motif</dt>
                      <dd>
                        <ToneBadge tone={BON_MOTIF_TONE[b.motif]}>{b.motif}</ToneBadge>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Montant</dt>
                      <dd className="tabular-nums font-medium text-foreground">
                        {formatFCFA(b.montant)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 hover:bg-muted/50 hover:bg-muted">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Référence
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Marchandise
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Qté
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                      Motif
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                      Montant
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedBons.map((b) => (
                    <TableRow
                      key={b.id}
                      className="border-b border-border hover:bg-muted/60"
                    >
                      <TableCell className="px-4 py-3.5 font-mono text-xs font-medium text-foreground">
                        {b.reference}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 tabular-nums text-muted-foreground sm:table-cell">
                        {formatDateShort(b.date)}
                      </TableCell>
                      <TableCell className="max-w-[140px] px-4 py-3.5">
                        <span className="line-clamp-1 text-sm text-muted-foreground">
                          {b.marchandise}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums text-foreground/90">
                        {b.quantite}{" "}
                        <span className="text-xs text-muted-foreground">{b.unite}</span>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 md:table-cell">
                        <ToneBadge tone={BON_MOTIF_TONE[b.motif]}>{b.motif}</ToneBadge>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-foreground sm:table-cell">
                        {formatFCFA(b.montant)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <ToneBadge tone={bonStatutTone(b.statut)}>{b.statut}</ToneBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              startIdx={bons.length === 0 ? 0 : (bonSafePage - 1) * PAGE_SIZE + 1}
              endIdx={Math.min(bonSafePage * PAGE_SIZE, bons.length)}
              totalItems={bons.length}
              page={bonSafePage}
              totalPages={bonPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </Card>
  );

  if (embedded) return content;
  return (
    <TabsContent value="bons" className="mt-6 focus-visible:outline-none">
      {content}
    </TabsContent>
  );
}
