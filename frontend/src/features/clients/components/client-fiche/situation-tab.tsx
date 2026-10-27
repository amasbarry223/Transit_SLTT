"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import type { Dossier, Facture, Societe } from "@/lib/domain-types";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { exportToExcel, htmlEscape, printHTML } from "@/lib/export";
import { resolveSlttBrand } from "@/lib/societe-brand";
import {
  anneesSituation,
  buildSituationClient,
  type SituationLigne,
} from "@/lib/situation-client";
import { STATUT_PAIEMENT_LABELS } from "@/lib/domain/dossier-finances";
import { StatutPaiementBadge } from "@/components/sltt/status-badge";
import { DossierLignesTables } from "@/components/sltt/dossier-detail/dossier-lignes-tables";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { TabsContent } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { TabEmptyState } from "./shared";

type SituationTabProps = {
  clientNom: string;
  dossiers: Dossier[];
  factures: Facture[];
  societes: Societe[];
  onOpenDossier: (id: string) => void;
};

const COLONNES = [
  "Date",
  "N° Dossier",
  "Nature marchandise",
  "Total contrat",
  "Montant payé",
  "Reste à payer",
  "Total dépenses",
  "Bénéfice net",
  "Statut",
] as const;

const montantCls = (v: number) => (v < 0 ? "text-red-600 dark:text-red-400" : undefined);

/** Onglet "Situation" — fiche Excel "Situation du client" : une ligne par dossier + totaux. */
export function SituationTab({ clientNom, dossiers, factures, societes, onOpenDossier }: SituationTabProps) {
  const { toast } = useToast();
  const [annee, setAnnee] = useState("all");
  const [detail, setDetail] = useState<SituationLigne | null>(null);

  const annees = useMemo(() => anneesSituation(dossiers), [dossiers]);
  const { lignes, totaux } = useMemo(
    () => buildSituationClient(dossiers, factures, annee),
    [dossiers, factures, annee],
  );
  const titre = `Situation du client ${clientNom}`;

  async function handleExportExcel() {
    if (lignes.length === 0) {
      toastWarning(toast, { title: "Rien à exporter", description: UI.errors.exportEmpty });
      return;
    }
    type Row = {
      date: string;
      numero: string;
      nature: string;
      totalContrat: number;
      montantPaye: number;
      resteAPayer: number;
      totalDepenses: number;
      beneficeNet: number;
      statut: string;
    };
    const rows: Row[] = [
      ...lignes.map((l) => ({
        date: formatDateShort(l.date),
        numero: l.numero,
        nature: l.nature,
        totalContrat: l.totalContrat,
        montantPaye: l.montantPaye,
        resteAPayer: l.resteAPayer,
        totalDepenses: l.totalDepenses,
        beneficeNet: l.beneficeNet,
        statut:
          (STATUT_PAIEMENT_LABELS[l.finances.statutPaiement] ?? l.finances.statutPaiement ?? "—") +
          (l.finances.perte ? " (Perte)" : ""),
      })),
      {
        date: "TOTAL",
        numero: "",
        nature: "",
        totalContrat: totaux.totalContrat,
        montantPaye: totaux.montantPaye,
        resteAPayer: totaux.resteAPayer,
        totalDepenses: totaux.totalDepenses,
        beneficeNet: totaux.beneficeNet,
        statut: "",
      },
    ];
    try {
      await exportToExcel<Row>(
        "clients",
        `situation-client-${clientNom.replace(/\s+/g, "-").toLowerCase()}`,
        [
          { header: "Date", accessor: (r) => r.date },
          { header: "N° Dossier", accessor: (r) => r.numero },
          { header: "Nature marchandise", accessor: (r) => r.nature },
          { header: "Total contrat (FCFA)", accessor: (r) => r.totalContrat },
          { header: "Montant payé (FCFA)", accessor: (r) => r.montantPaye },
          { header: "Reste à payer (FCFA)", accessor: (r) => r.resteAPayer },
          { header: "Total dépenses (FCFA)", accessor: (r) => r.totalDepenses },
          { header: "Bénéfice net (FCFA)", accessor: (r) => r.beneficeNet },
          { header: "Statut", accessor: (r) => r.statut },
        ],
        rows,
        { module: "Clients" },
      );
    } catch (error) {
      toastError(toast, error, { title: "Impossible de générer l'export Excel", fallback: UI.errors.exportFailed });
      return;
    }
    toastSuccess(toast, { title: "Export Excel généré", description: titre });
  }

  function handleExportPdf() {
    if (lignes.length === 0) {
      toastWarning(toast, { title: "Rien à exporter", description: UI.errors.exportEmpty });
      return;
    }
    const num = (v: number) => `<td class="num">${formatFCFA(v, false)}</td>`;
    printHTML(
      titre,
      `
      <h1>${htmlEscape(titre)}</h1>
      <div class="subtitle">${annee === "all" ? "Toutes les années" : `Année ${htmlEscape(annee)}`} · montants en FCFA</div>
      <table>
        <thead><tr>${COLONNES.map((c, i) => `<th${i >= 3 && i <= 7 ? ' class="num"' : ""}>${c}</th>`).join("")}</tr></thead>
        <tbody>
          ${lignes
            .map(
              (l) => `<tr><td>${formatDateShort(l.date)}</td><td class="mono">${htmlEscape(l.numero)}</td><td>${htmlEscape(l.nature)}</td>` +
                `${num(l.totalContrat)}${num(l.montantPaye)}${num(l.resteAPayer)}${num(l.totalDepenses)}${num(l.beneficeNet)}` +
                `<td>${htmlEscape(STATUT_PAIEMENT_LABELS[l.finances.statutPaiement] ?? l.finances.statutPaiement ?? "—")}${l.finances.perte ? " (Perte)" : ""}</td></tr>`,
            )
            .join("")}
          <tr class="total-row"><th colspan="3">Total</th>${num(totaux.totalContrat)}${num(totaux.montantPaye)}` +
            `${num(totaux.resteAPayer)}${num(totaux.totalDepenses)}${num(totaux.beneficeNet)}<td></td></tr>
        </tbody>
      </table>`,
      resolveSlttBrand(societes),
    );
  }

  return (
    <TabsContent value="situation" className="mt-6 space-y-4 focus-visible:outline-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={annee} onValueChange={setAnnee}>
          <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par année">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes années</SelectItem>
            {annees.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="size-4" />
            Exporter Excel
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="size-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {lignes.length === 0 ? (
        <TabEmptyState label="Aucun dossier pour cette période." />
      ) : (
        <Card className="overflow-hidden border-border/80 p-0 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  {COLONNES.map((c, i) => (
                    <th key={c} className={cn("px-3 py-2.5 font-medium", i >= 3 && i <= 7 ? "text-right" : "text-left")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr
                    key={l.dossier.id}
                    className="cursor-pointer border-t border-border hover:bg-muted/40"
                    onClick={() => setDetail(l)}
                  >
                    <td className="px-3 py-2.5 tabular-nums">{formatDateShort(l.date)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold text-primary">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDossier(l.dossier.id);
                        }}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        aria-label={`Ouvrir le dossier ${l.numero}`}
                      >
                        {l.numero}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">{l.nature}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(l.totalContrat)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(l.montantPaye)}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right tabular-nums",
                        l.resteAPayer > 0 ? "text-amber-700 dark:text-amber-300" : montantCls(l.resteAPayer),
                      )}
                    >
                      {formatFCFA(l.resteAPayer)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(l.totalDepenses)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-semibold tabular-nums", montantCls(l.beneficeNet))}>
                      {formatFCFA(l.beneficeNet)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatutPaiementBadge statut={l.finances.statutPaiement} size="sm" />
                        {l.finances.perte && (
                          <span className="inline-flex items-center rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                            Perte : {formatFCFA(l.beneficeNet)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                  <td className="px-3 py-2.5" colSpan={3}>
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.totalContrat)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.montantPaye)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.resteAPayer)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.totalDepenses)}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums", montantCls(totaux.beneficeNet))}>
                    {formatFCFA(totaux.beneficeNet)}
                  </td>
                  <td className="px-3 py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-3xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {detail.dossier.reference || detail.numero}
                  <StatutPaiementBadge statut={detail.finances.statutPaiement} size="sm" />
                </DialogTitle>
                <DialogDescription>
                  {formatDateShort(detail.date)} · {detail.nature} · Total contrat {formatFCFA(detail.totalContrat)} ·
                  Bénéfice net {formatFCFA(detail.beneficeNet)}
                </DialogDescription>
              </DialogHeader>
              <DossierLignesTables dossier={detail.dossier} />
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenDossier(detail.dossier.id)}>
                  Ouvrir le dossier
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
