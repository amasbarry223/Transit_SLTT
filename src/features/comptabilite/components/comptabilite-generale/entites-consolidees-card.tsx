"use client";

import { Building2 } from "lucide-react";
import type { EntiteComptable } from "@/lib/domain-types";
import type { OperationsTotals } from "@/lib/comptabilite-generale";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface EntiteTotal {
  entite: EntiteComptable;
  totals: OperationsTotals;
}

interface EntitesConsolideesCardProps {
  entiteTotals: EntiteTotal[];
  activeEntiteKey: string;
  onSelectEntite: (key: string) => void;
}

function entiteKeyOf(entite: { type: string; id: string }): string {
  return `${entite.type}:${entite.id}`;
}

/** Vue groupe — totaux par entité côte à côte, jamais un journal mélangé (chaque entité garde son propre cumul, cf. computeRunningEcart). */
export function EntitesConsolideesCard({ entiteTotals, activeEntiteKey, onSelectEntite }: EntitesConsolideesCardProps) {
  if (entiteTotals.length < 2) return null;

  const groupTotals = entiteTotals.reduce(
    (acc, e) => ({
      totalEntree: acc.totalEntree + e.totals.totalEntree,
      totalSortie: acc.totalSortie + e.totals.totalSortie,
      soldeTheorique: acc.soldeTheorique + e.totals.soldeTheorique,
    }),
    { totalEntree: 0, totalSortie: 0, soldeTheorique: 0 },
  );

  return (
    <Card className="border-border/80 gap-0 overflow-hidden p-0 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Building2 className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Vue consolidée — groupe</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-slate-50 hover:bg-muted/50 hover:bg-muted">
              <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Entité</TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Entrées</TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Sorties</TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Écart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entiteTotals.map(({ entite, totals }) => {
              const key = entiteKeyOf(entite);
              const active = key === activeEntiteKey;
              return (
                <TableRow
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-label={`Voir le détail de ${entite.label}`}
                  className={cn(
                    "cursor-pointer border-b border-border hover:bg-muted/60",
                    active && "bg-primary/5 hover:bg-primary/5",
                  )}
                  onClick={() => onSelectEntite(key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectEntite(key);
                    }
                  }}
                >
                  <TableCell className={cn("px-4 py-3 font-medium", active ? "text-primary" : "text-foreground")}>
                    {entite.label}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatFCFA(totals.totalEntree)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                    {formatFCFA(totals.totalSortie)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3 text-right font-medium tabular-nums",
                      totals.soldeTheorique >= 0 ? "text-foreground/90" : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {formatFCFA(totals.soldeTheorique)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="border-t-2 border-border font-semibold bg-muted/40">
              <TableCell className="px-4 py-3 text-foreground">Groupe (total)</TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatFCFA(groupTotals.totalEntree)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums text-amber-700 dark:text-amber-400">
                {formatFCFA(groupTotals.totalSortie)}
              </TableCell>
              <TableCell
                className={cn(
                  "px-4 py-3 text-right tabular-nums",
                  groupTotals.soldeTheorique >= 0 ? "text-foreground" : "text-red-700 dark:text-red-400",
                )}
              >
                {formatFCFA(groupTotals.soldeTheorique)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
