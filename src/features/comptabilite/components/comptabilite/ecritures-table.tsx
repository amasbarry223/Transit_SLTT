import { CircleCheck, HandCoins, Plus, Receipt } from "lucide-react";
import type { Ecriture } from "@/lib/store";
import { resteAPayer } from "@/lib/domain-types";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/sltt/empty-state";
import { UI } from "@/lib/ui-messages";
import { EcritureStatutBadge, EcartValue } from "@/components/sltt/status-badge";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { TablePagination } from "@/components/sltt/table-pagination";
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
import { deriveStatut, modeIcon } from "./shared";

interface EcrituresTableProps {
  ecritures: Ecriture[];
  totalItems: number;
  hasActiveFilters: boolean;
  canWrite: boolean;
  startIdx: number;
  endIdx: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPayment: (ecriture: Ecriture) => void;
  onCreate: () => void;
}

export function EcrituresTable({
  ecritures,
  totalItems,
  hasActiveFilters,
  canWrite,
  startIdx,
  endIdx,
  page,
  totalPages,
  onPageChange,
  onPayment,
  onCreate,
}: EcrituresTableProps) {
  return (
    <Card className="border-border/80 gap-0 overflow-hidden p-0 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Receipt className="size-4 text-slate-400 dark:text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Écritures comptables</h2>
      </div>
      {totalItems === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasActiveFilters ? UI.empty.ecritures.filtered.title : UI.empty.ecritures.zero.title}
          description={hasActiveFilters ? UI.empty.ecritures.filtered.description : UI.empty.ecritures.zero.description}
          action={!hasActiveFilters && canWrite ? (
            <Button onClick={onCreate}><Plus className="size-4" />{UI.empty.ecritures.zero.action}</Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {ecritures.map((ecriture) => {
              const reste = resteAPayer(ecriture);
              const statut = deriveStatut(ecriture);
              const ModeIcon = modeIcon[ecriture.modePaiement];
              const solde = reste === 0;
              return (
                <Card
                  key={ecriture.id}
                  className={cn("border-border/80 p-4 shadow-sm", !solde && "bg-amber-50/20 dark:bg-amber-950/20")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{ecriture.clientNom}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDateShort(ecriture.date)}</p>
                    </div>
                    <EcritureStatutBadge statut={statut} />
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <MobileValue label="Société"><SocieteBadge societeNom={ecriture.societeNom} size="sm" /></MobileValue>
                    <MobileValue label="Investi"><span className="tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(ecriture.montantInvesti)}</span></MobileValue>
                    <MobileValue label="Payé"><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatFCFA(ecriture.montantPaye)}</span></MobileValue>
                    <MobileValue label="Reste dû">
                      {solde
                        ? <span className="font-medium text-emerald-600 dark:text-emerald-400">Soldé</span>
                        : <span className="font-semibold text-amber-600 dark:text-amber-400">{formatFCFA(reste)}</span>}
                    </MobileValue>
                    <MobileValue label="Mode">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <ModeIcon className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        {ecriture.modePaiement}
                      </span>
                    </MobileValue>
                  </dl>
                  {!solde && (
                    <div className="mt-3 flex justify-end border-t border-border pt-3">
                      <Button variant="outline" size="sm" className="gap-1.5 text-primary" onClick={() => onPayment(ecriture)}>
                        <HandCoins className="size-3.5" />Enregistrer un paiement
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800">
                  <Heading>Date</Heading>
                  <Heading>Client</Heading>
                  <Heading className="hidden sm:table-cell">Société</Heading>
                  <Heading className="hidden text-right sm:table-cell">Investi</Heading>
                  <Heading className="hidden text-right md:table-cell">Payé</Heading>
                  <Heading className="text-right">Reste dû</Heading>
                  <Heading className="hidden text-right lg:table-cell"><GlossaryLabel term="ecartReglement" short className="justify-end" /></Heading>
                  <Heading className="hidden md:table-cell">Mode</Heading>
                  <Heading>Statut</Heading>
                  <Heading className="text-right">Actions</Heading>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ecritures.map((ecriture) => {
                  const reste = resteAPayer(ecriture);
                  const solde = reste === 0;
                  const ModeIcon = modeIcon[ecriture.modePaiement];
                  return (
                    <TableRow
                      key={ecriture.id}
                      className={cn("border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60", !solde && "bg-amber-50/20 dark:bg-amber-950/20")}
                    >
                      <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">{formatDateShort(ecriture.date)}</TableCell>
                      <TableCell className="px-4 py-3.5">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{ecriture.clientNom}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500 sm:hidden">{ecriture.id}</p>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 sm:table-cell"><SocieteBadge societeNom={ecriture.societeNom} size="sm" /></TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 sm:table-cell">{formatFCFA(ecriture.montantInvesti)}</TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 md:table-cell">{formatFCFA(ecriture.montantPaye)}</TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums">
                        {solde
                          ? <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Soldé</span>
                          : <span className="font-semibold text-amber-600 dark:text-amber-400">{formatFCFA(reste)}</span>}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 text-right lg:table-cell"><EcartValue value={ecriture.montantPaye - ecriture.montantInvesti} /></TableCell>
                      <TableCell className="hidden px-4 py-3.5 md:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300" title={ecriture.modePaiement}>
                          <ModeIcon className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span className="text-sm">{ecriture.modePaiement}</span>
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5"><EcritureStatutBadge statut={deriveStatut(ecriture)} /></TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {solde ? (
                            <span className="flex size-8 items-center justify-center text-emerald-500" title="Écriture soldée" aria-label="Écriture soldée">
                              <CircleCheck className="size-4" />
                            </span>
                          ) : (
                            <Button variant="ghost" size="icon" className="size-8 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => onPayment(ecriture)} aria-label={`Enregistrer un paiement pour ${ecriture.clientNom}`} title="Enregistrer un paiement">
                              <HandCoins className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            startIdx={startIdx}
            endIdx={endIdx}
            totalItems={totalItems}
            itemLabel={`écriture${totalItems !== 1 ? "s" : ""}`}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </Card>
  );
}

function MobileValue({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt><dd>{children}</dd></div>;
}

function Heading({ className, children }: { className?: string; children: React.ReactNode }) {
  return <TableHead className={cn("h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400", className)}>{children}</TableHead>;
}
