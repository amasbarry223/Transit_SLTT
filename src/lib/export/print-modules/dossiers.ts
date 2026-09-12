"use client";

import { BRAND } from "@/lib/brand-colors";
import { ensureSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
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
import { fmtDate, fmtFCFA, fmtFCFAPlain } from "./shared";

/* ------------------------------------------------------------------ */
/* printDossiers — liste des dossiers de transit (A4 paysage)          */
/* Même identité visuelle que printClasseur : papier à en-tête         */
/* officiel, bandeau navy, synthèse chiffrée, tableau rayé.            */
/* Paysage : 7 colonnes dont 2 montants ne tiennent pas en portrait    */
/* sans que le client passe à la ligne. Pas de colonne Statut (retirée). */
/* ------------------------------------------------------------------ */

export interface DossierPrintRow {
  reference: string;
  clientNom: string;
  bl: string;
  camion: string;
  nature: string;
  prestation: number;
  marge: number;
  statut: string;
}

export interface DossierPrintTotals {
  total: number;
  enCours: number;
  soldes: number;
  margeCumulee: number;
}

export function printDossiers(
  rows: DossierPrintRow[],
  totals: DossierPrintTotals,
  filterLabel?: string,
  societe?: SocieteBrand | null,
): void {
  const safeSociete = ensureSocieteBrand(societe);
  const letterheadHTML = buildOfficialLetterheadHTML(safeSociete);
  const today = fmtDate(new Date().toISOString());

  const amount = (n: number, cls = "") =>
    n > 0
      ? `<span class="col-amount ${cls}">${fmtFCFAPlain(n)}</span>`
      : `<span class="empty">—</span>`;

  const rowsHTML = rows
    .map(
      (r, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="col-ref">${htmlEscape(r.reference)}</td>
      <td class="col-text">${htmlEscape(r.clientNom)}</td>
      <td class="col-mono">${htmlEscape(r.bl) || '<span class="empty">—</span>'}</td>
      <td class="col-mono">${htmlEscape(r.camion) || '<span class="empty">—</span>'}</td>
      <td class="col-text">${htmlEscape(r.nature) || '<span class="empty">—</span>'}</td>
      <td class="cell-amount">${amount(r.prestation)}</td>
      <td class="cell-amount">${amount(r.marge, r.marge >= 0 ? "amount-pos" : "amount-neg")}</td>
    </tr>`,
    )
    .join("");

  const margeCls = totals.margeCumulee >= 0 ? "summary-value--ok" : "summary-value--neg";

  const win = acquirePrintTarget({ widthMm: 297, heightMm: 210 });
  if (!win) {
    warnPopupBlocked();
    return;
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Liste des dossiers de transit</title>
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

.doc-section { padding: 14px 26px 0; }
.doc-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 20px; padding-bottom: 10px;
}
.doc-eyebrow {
  font-size: 8px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.14em; color: ${BRAND.red}; margin-bottom: 3px;
}
.doc-title {
  font-size: 18px; font-weight: 800; color: ${BRAND.navy};
  letter-spacing: -0.02em; line-height: 1.1;
}
.doc-meta { text-align: right; flex-shrink: 0; }
.doc-date { font-size: 10px; color: #6b7280; }
.doc-ref { margin-top: 3px; font-size: 9px; color: #9ca3af; font-variant-numeric: tabular-nums; }
.doc-filter {
  display: inline-block; margin-top: 6px; background: ${BRAND.primaryLight};
  color: ${BRAND.navy}; border: 1px solid #c7cbf0; border-radius: 9999px;
  padding: 2px 10px; font-size: 9px; font-weight: 700;
}

.summary {
  display: grid; grid-template-columns: repeat(4, 1fr);
  margin: 0 26px; border: 1px solid #d2dbe9; border-radius: 6px;
  overflow: hidden; background: #fafbfc;
}
.summary-item { padding: 9px 12px; border-right: 1px solid #d2dbe9; }
.summary-item:last-child { border-right: none; }
.summary-label {
  font-size: 7.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #92a3ba; margin-bottom: 4px;
}
.summary-value {
  font-size: 16px; font-weight: 800; color: ${BRAND.navy};
  line-height: 1; font-variant-numeric: tabular-nums;
}
.summary-value--ok { color: #126a32; }
.summary-value--neg { color: #b42318; }
.summary-hint { font-size: 8.5px; color: #92a3ba; margin-top: 3px; }

.table-section { padding: 12px 26px 18px; }
.table-caption { padding: 0 1px 6px; font-size: 8.5px; color: #92a3ba; font-style: italic; }
.table-wrap { border: 1px solid #d2dbe9; border-radius: 6px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-ref { width: 14%; }
colgroup .c-client { width: 22%; }
colgroup .c-bl { width: 12%; }
colgroup .c-camion { width: 11%; }
colgroup .c-nature { width: 22%; }
colgroup .c-prest, colgroup .c-marge { width: 9.5%; }
thead th {
  background: ${BRAND.navy}; color: #fff; padding: 6px 8px;
  font-size: 7.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; text-align: left; white-space: nowrap;
  border-right: 1px solid rgba(255,255,255,0.18);
}
thead th:last-child { border-right: none; }
thead th.head-amount { text-align: right; }
tbody td {
  padding: 6px 8px; border-bottom: 1px solid #eef1f5;
  border-right: 1px solid #eef1f5; vertical-align: middle;
}
tbody td:last-child { border-right: none; }
.row-even { background: #fff; }
.row-odd { background: #f9fafb; }
.col-ref { font-weight: 700; color: #1f2937; font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.col-mono {
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  color: #45556b; font-size: 9px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
/* Texte libre — seules colonnes autorisées à tronquer (un mot coupé reste lisible). */
.col-text { color: #45556b; font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-amount { text-align: right; }
/* Jamais de troncature sur un montant. */
.col-amount { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 10px; color: #1f2937; white-space: nowrap; }
.amount-pos { color: #126a32; }
.amount-neg { color: #b42318; }
.empty { color: #cdd4df; font-weight: 400; }
tfoot td {
  background: ${BRAND.navy}; color: #fff; padding: 8px 8px;
  font-weight: 700; font-size: 10px; border-right: 1px solid rgba(255,255,255,0.18);
}
tfoot td:last-child { border-right: none; }
tfoot .total-amount { text-align: right; font-variant-numeric: tabular-nums; color: #fde68a; font-size: 11px; }

.footer {
  padding: 10px 26px 16px; border-top: 1px solid #d2dbe9;
  display: flex; justify-content: space-between; align-items: center; background: #fafbfc;
}
.footer-note { font-size: 8.5px; color: #92a3ba; line-height: 1.5; }
.footer-brand { font-size: 9.5px; font-weight: 800; color: ${BRAND.navy}; }

.no-print { text-align: center; padding: 14px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print {
  background: ${BRAND.navy}; color: #fff; border: none; padding: 10px 28px;
  border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
}

@media print {
  @page { size: A4 landscape; margin: 10mm 9mm; }
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
        <h1 class="doc-title">Liste des dossiers de transit</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-date">Édité le ${today}</div>
        <div class="doc-ref">Réf. DOS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</div>
        ${filterLabel ? `<div class="doc-filter">${htmlEscape(filterLabel)}</div>` : ""}
      </div>
    </div>
  </section>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total dossiers</div>
      <div class="summary-value">${totals.total}</div>
      <div class="summary-hint">dans cette sélection</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">En cours</div>
      <div class="summary-value summary-value--neg">${totals.enCours}</div>
      <div class="summary-hint">traitement douanier</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Soldés</div>
      <div class="summary-value summary-value--ok">${totals.soldes}</div>
      <div class="summary-hint">dossiers clôturés</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Marge cumulée</div>
      <div class="summary-value ${margeCls}">${fmtFCFA(totals.margeCumulee)}</div>
      <div class="summary-hint">prestation − frais</div>
    </div>
  </div>

  <section class="table-section">
    <div class="table-caption">Montants en francs CFA (FCFA) · Marge = frais de prestation − (droits de douane + frais de circuit)</div>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col class="c-ref"><col class="c-client"><col class="c-bl"><col class="c-camion">
          <col class="c-nature"><col class="c-prest"><col class="c-marge">
        </colgroup>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Client</th>
            <th>N° BL</th>
            <th>Camion</th>
            <th>Nature</th>
            <th class="head-amount">Prestation</th>
            <th class="head-amount">Marge</th>
          </tr>
        </thead>
        <tbody>${rowsHTML || `<tr><td colspan="7" style="padding:16px;text-align:center;color:#92a3ba">Aucun dossier</td></tr>`}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">Total — ${rows.length} dossier${rows.length !== 1 ? "s" : ""}</td>
            <td class="total-amount">${fmtFCFAPlain(rows.reduce((s, r) => s + r.prestation, 0))}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.margeCumulee)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-note">Document confidentiel · usage interne uniquement<br>${platformFooterHTML(safeSociete.nom)}</div>
    <div class="footer-brand">${documentFooterHTML(safeSociete.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
