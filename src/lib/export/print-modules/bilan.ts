"use client";

import { BRAND } from "@/lib/brand-colors";
import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import {
  OFFICIAL_LETTERHEAD_CSS,
  buildOfficialLetterheadHTML,
  documentFooterHTML,
  platformFooterHTML,
  acquirePrintTarget,
  triggerPrint,
  warnPopupBlocked,
} from "../print-document";
import { fmtFCFA, fmtFCFAPlain } from "./shared";

/* ------------------------------------------------------------------ */
/* printBilan — bilan financier par client (module Bilans)             */
/* En-tête calqué sur le papier à en-tête officiel (identique à         */
/* l'annuaire clients, au classeur et à la facture) pour une identité   */
/* visuelle cohérente entre tous les documents imprimés SLTT.           */
/* ------------------------------------------------------------------ */

export interface BilanPrintRow {
  client: string;
  investi: number;
  encaisse: number;
  reste: number;
  ecart: number;
}

export interface BilanPrintTotals {
  investi: number;
  encaisse: number;
  reste: number;
  ecart: number;
}

export function printBilan(
  periodeLabel: string,
  rows: BilanPrintRow[],
  totals: BilanPrintTotals,
  tauxRecouvrement: number,
  societe?: SocieteBrand | null,
): void {
  if (!requireSocieteBrand(societe, "le bilan financier")) return;
  const letterheadHTML = buildOfficialLetterheadHTML(societe);
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const rowsHTML = rows
    .map(
      (r, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="col-client">${htmlEscape(r.client)}</td>
      <td class="col-amount">${fmtFCFAPlain(r.investi)}</td>
      <td class="col-amount amount-credit">${fmtFCFAPlain(r.encaisse)}</td>
      <td class="col-amount ${r.reste > 0 ? "amount-due" : "amount-clear"}">${r.reste > 0 ? fmtFCFAPlain(r.reste) : "<span class='empty'>—</span>"}</td>
      <td class="col-amount ${r.ecart < 0 ? "amount-due" : "amount-clear"}">${fmtFCFAPlain(r.ecart)}</td>
    </tr>`,
    )
    .join("");

  const win = acquirePrintTarget();
  if (!win) { warnPopupBlocked(); return; }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bilan — ${htmlEscape(periodeLabel)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #fff;
  color: #1f2937;
  font-size: 12px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap { max-width: 100%; margin: 0 auto; }

${OFFICIAL_LETTERHEAD_CSS}

/* Bandeau document */
.doc-section { padding: 16px 28px 0; }
.doc-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding-bottom: 12px;
}
.doc-eyebrow {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: ${BRAND.red};
  margin-bottom: 3px;
}
.doc-title {
  font-size: 18px;
  font-weight: 800;
  color: ${BRAND.navy};
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.doc-meta { text-align: right; flex-shrink: 0; }
.doc-date { font-size: 10px; color: #6b7280; }
.doc-ref {
  margin-top: 3px;
  font-size: 9px;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}
.doc-filter {
  display: inline-block;
  margin-top: 6px;
  background: ${BRAND.primaryLight};
  color: ${BRAND.navy};
  border: 1px solid #c7cbf0;
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 9px;
  font-weight: 700;
}

/* Synthèse chiffrée */
.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0 28px;
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  overflow: hidden;
  background: #fafbfc;
}
.summary-item {
  padding: 10px 12px;
  border-right: 1px solid #d2dbe9;
}
.summary-item:last-child { border-right: none; }
.summary-label {
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #92a3ba;
  margin-bottom: 4px;
}
.summary-value {
  font-size: 16px;
  font-weight: 800;
  color: ${BRAND.navy};
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.summary-value--credit { color: #126a32; }
.summary-value--warn { color: #b45309; }
.summary-value--ok { color: #126a32; }
.summary-hint { font-size: 8.5px; color: #92a3ba; margin-top: 3px; }

/* Tableau compact A4 portrait */
.table-caption {
  padding: 0 1px 6px;
  font-size: 8.5px;
  color: #92a3ba;
  font-style: italic;
}
.table-section { padding: 14px 28px 20px; }
.table-wrap {
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-client { width: 32%; }
colgroup .c-investi,
colgroup .c-encaisse,
colgroup .c-reste,
colgroup .c-ecart { width: 17%; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 7px 10px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  white-space: nowrap;
  border-right: 1px solid rgba(255,255,255,0.18);
}
thead th:last-child { border-right: none; }
thead th.head-amount { text-align: right; }
tbody td {
  padding: 7px 10px;
  border-bottom: 1px solid #eef1f5;
  border-right: 1px solid #eef1f5;
  vertical-align: middle;
}
tbody td:last-child { border-right: none; }
.row-even { background: #fff; }
.row-odd { background: #f9fafb; }
.col-client { color: #1f2937; font-weight: 700; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Jamais d'ellipse/troncature sur un montant. */
.col-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 10px;
  color: #1f2937;
  white-space: normal;
  word-break: keep-all;
}
.amount-credit { color: #126a32; }
.amount-due { color: #b45309; }
.amount-clear { color: #126a32; }
.empty { color: #cdd4df; font-weight: 400; }
tfoot td {
  background: ${BRAND.navy};
  color: #fff;
  padding: 9px 10px;
  font-weight: 700;
  font-size: 10px;
  border-right: 1px solid rgba(255,255,255,0.18);
}
tfoot td:last-child { border-right: none; }
tfoot .total-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #fde68a;
  font-size: 11px;
}

/* Pied de page */
.footer {
  padding: 10px 28px 16px;
  border-top: 1px solid #d2dbe9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
}
.footer-note { font-size: 8.5px; color: #92a3ba; line-height: 1.5; }
.footer-brand { font-size: 9.5px; font-weight: 800; color: ${BRAND.navy}; }

.no-print {
  text-align: center;
  padding: 14px;
  background: #f3f5f7;
  border-bottom: 1px solid #d2dbe9;
}
.btn-print {
  background: ${BRAND.navy};
  color: #fff;
  border: none;
  padding: 10px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  .no-print { display: none !important; }
  body { background: white; font-size: 10px; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
}
</style>
</head>
<body>
<div class="wrap">

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  </div>

  ${letterheadHTML}

  <section class="doc-section">
    <div class="doc-head">
      <div>
        <div class="doc-eyebrow">Document interne</div>
        <h1 class="doc-title">Bilan financier</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-date">Édité le ${today}</div>
        <div class="doc-ref">Réf. BIL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</div>
        <div class="doc-filter">${htmlEscape(periodeLabel)}</div>
      </div>
    </div>
  </section>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total investi</div>
      <div class="summary-value">${fmtFCFA(totals.investi)}</div>
      <div class="summary-hint">${rows.length} client${rows.length !== 1 ? "s" : ""}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total encaissé</div>
      <div class="summary-value summary-value--credit">${fmtFCFA(totals.encaisse)}</div>
      <div class="summary-hint">taux de recouvrement ${tauxRecouvrement}%</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Reste à payer</div>
      <div class="summary-value ${totals.reste > 0 ? "summary-value--warn" : "summary-value--ok"}">${fmtFCFA(totals.reste)}</div>
      <div class="summary-hint">${totals.reste > 0 ? "à recouvrer" : "tout encaissé"}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Écart de règlement</div>
      <div class="summary-value ${totals.ecart < 0 ? "summary-value--warn" : "summary-value--ok"}">${fmtFCFA(totals.ecart)}</div>
      <div class="summary-hint">encaissé − investi</div>
    </div>
  </div>

  <section class="table-section">
    <div class="table-caption">Montants en francs CFA (FCFA)</div>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col class="c-client"><col class="c-investi"><col class="c-encaisse"><col class="c-reste"><col class="c-ecart">
        </colgroup>
        <thead>
          <tr>
            <th>Client</th>
            <th class="head-amount">Investi</th>
            <th class="head-amount">Encaissé</th>
            <th class="head-amount">Reste à payer</th>
            <th class="head-amount">Écart de règlement</th>
          </tr>
        </thead>
        <tbody>${rowsHTML || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#92a3ba">Aucune donnée pour cette période</td></tr>`}</tbody>
        <tfoot>
          <tr>
            <td>Total — ${rows.length} client${rows.length !== 1 ? "s" : ""}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.investi)}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.encaisse)}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.reste)}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.ecart)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-note">Document confidentiel · usage interne uniquement<br>${platformFooterHTML(societe.nom)}</div>
    <div class="footer-brand">${documentFooterHTML(societe.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
