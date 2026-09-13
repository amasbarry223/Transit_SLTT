import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/sltt/empty-state";
import { EcartValue } from "@/components/sltt/status-badge";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { formatFCFA } from "@/lib/format";
import { SortableHead } from "./sortable-head";
import type { SortDir, SortKey } from "./shared";

interface RecapRow {
  client: string;
  investi: number;
  encaisse: number;
  reste: number;
  ecart: number;
}

interface RecapClientCardProps {
  sortedRecap: RecapRow[];
  recapTotaux: { investi: number; encaisse: number; reste: number; ecart: number };
  hasData: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  periodeLabel: string;
  totalClients: number;
}

export function RecapClientCard({
  sortedRecap,
  recapTotaux,
  hasData,
  sortKey,
  sortDir,
  onSort,
  periodeLabel,
  totalClients,
}: RecapClientCardProps) {
  return (
    <Card className="p-5 shadow-sm border-border/80 lg:col-span-2 gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Récapitulatif par client
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {totalClients} client{totalClients !== 1 ? "s" : ""} · {periodeLabel}
        </span>
      </div>
      {sortedRecap.length === 0 ? (
        <EmptyState icon={Users} title="Aucune écriture pour cette période." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {sortedRecap.map((r) => (
              <Card key={r.client} className="border-border/80 p-4 shadow-sm">
                <p className="font-medium text-slate-800 dark:text-slate-200">{r.client}</p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Investi</dt>
                    <dd className="tabular-nums text-foreground/90">{formatFCFA(r.investi)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Encaissé</dt>
                    <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatFCFA(r.encaisse)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground"><GlossaryLabel term="resteAPayer" short /></dt>
                    <dd className="font-medium tabular-nums text-amber-600 dark:text-amber-400">{formatFCFA(r.reste)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground"><GlossaryLabel term="ecartReglement" short /></dt>
                    <dd><EcartValue value={r.ecart} /></dd>
                  </div>
                </dl>
              </Card>
            ))}
            {hasData && (
              <Card className="border-border/80 p-4 shadow-sm bg-muted">
                <p className="font-bold text-foreground">Total</p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Investi</dt>
                    <dd className="font-bold tabular-nums text-foreground">{formatFCFA(recapTotaux.investi)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Encaissé</dt>
                    <dd className="font-bold tabular-nums text-foreground">{formatFCFA(recapTotaux.encaisse)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Reste</dt>
                    <dd className="font-bold tabular-nums text-foreground">{formatFCFA(recapTotaux.reste)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Écart</dt>
                    <dd className="font-bold tabular-nums text-foreground">{formatFCFA(recapTotaux.ecart)}</dd>
                  </div>
                </dl>
              </Card>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <SortableHead
                  col="client"
                  label="Client"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  align="left"
                />
                <SortableHead
                  col="investi"
                  label="Investi"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableHead
                  col="encaisse"
                  label="Encaissé"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableHead
                  col="reste"
                  label={<GlossaryLabel term="resteAPayer" short />}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableHead
                  col="ecart"
                  label={<GlossaryLabel term="ecartReglement" short />}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecap.map((r) => (
                <TableRow
                  key={r.client}
                  className="border-b border-border hover:bg-muted/60"
                >
                  <TableCell className="font-medium text-foreground/90">
                    {r.client}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground/90">
                    {formatFCFA(r.investi)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatFCFA(r.encaisse)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-amber-600 dark:text-amber-400">
                    {formatFCFA(r.reste)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EcartValue value={r.ecart} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {hasData && (
              <TableFooter>
                <TableRow className="border-0 bg-muted/50 hover:bg-muted">
                  <TableCell className="font-bold text-foreground">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-foreground">
                    {formatFCFA(recapTotaux.investi)}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-foreground">
                    {formatFCFA(recapTotaux.encaisse)}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-foreground">
                    {formatFCFA(recapTotaux.reste)}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-foreground">
                    {formatFCFA(recapTotaux.ecart)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
          </div>
        </>
      )}
    </Card>
  );
}
