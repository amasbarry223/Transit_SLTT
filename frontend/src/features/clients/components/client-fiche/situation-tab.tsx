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
  type SituationTotaux,
} from "@/lib/situation-client";
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
  "Nature marchandise",
  "Quantité",
  "Facture N°",
  "Total contrat",
  "Montant payé",
  "Reste à payer",
  "Bénéfice net",
  "Dépenses",
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
    type Row = { date: string; nature: string; quantite: number | string; factures: string } & SituationTotaux;
    const rows: Row[] = [
      ...lignes.map((l) => ({ ...l, date: formatDateShort(l.date), quantite: l.quantite ?? "" })),
      { date: "TOTAL", nature: "", quantite: "", factures: "", ...totaux },
    ];
    try {
      await exportToExcel<Row>(
        "clients",
        `situation-client-${clientNom.replace(/\s+/g, "-").toLowerCase()}`,
        [
          { header: "Date", accessor: (r) => r.date },
          { header: "Nature marchandise", accessor: (r) => r.nature },
          { header: "Quantité", accessor: (r) => r.quantite },
          { header: "Facture N°", accessor: (r) => r.factures },
          { header: "Total contrat (FCFA)", accessor: (r) => r.totalContrat },
          { header: "Montant payé (FCFA)", accessor: (r) => r.montantPaye },
          { header: "Reste à payer (FCFA)", accessor: (r) => r.resteAPayer },
          { header: "Bénéfice net (FCFA)", accessor: (r) => r.beneficeNet },
          { header: "Dépenses (FCFA)", accessor: (r) => r.totalDepenses },
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
        <thead><tr>${COLONNES.map((c, i) => `<th${i >= 4 ? ' class="num"' : ""}>${c}</th>`).join("")}</tr></thead>
        <tbody>
          ${lignes
            .map(
              (l) => `<tr><td>${formatDateShort(l.date)}</td><td>${htmlEscape(l.nature)}</td>` +
                `<td>${l.quantite ?? ""}</td><td>${htmlEscape(l.factures) || "—"}</td>` +
                `${num(l.totalContrat)}${num(l.montantPaye)}${num(l.resteAPayer)}${num(l.beneficeNet)}${num(l.totalDepenses)}</tr>`,
            )
            .join("")}
          <tr class="total-row"><th colspan="4">Total</th>${num(totaux.totalContrat)}${num(totaux.montantPaye)}` +
            `${num(totaux.resteAPayer)}${num(totaux.beneficeNet)}${num(totaux.totalDepenses)}</tr>
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
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  {COLONNES.map((c, i) => (
                    <th key={c} className={cn("px-3 py-2.5 font-medium", i >= 4 ? "text-right" : "text-left")}>
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
                    <td className="px-3 py-2.5">{l.nature}</td>
                    <td className="px-3 py-2.5 tabular-nums">{l.quantite ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{l.factures || "—"}</td>
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
                    <td className={cn("px-3 py-2.5 text-right font-semibold tabular-nums", montantCls(l.beneficeNet))}>
                      {formatFCFA(l.beneficeNet)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(l.totalDepenses)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                  <td className="px-3 py-2.5" colSpan={4}>
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.totalContrat)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.montantPaye)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.resteAPayer)}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums", montantCls(totaux.beneficeNet))}>
                    {formatFCFA(totaux.beneficeNet)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFCFA(totaux.totalDepenses)}</td>
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
                  {detail.dossier.reference}
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
