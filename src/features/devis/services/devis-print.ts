"use client";

import { BRAND } from "@/lib/brand-colors";
import {
  DEFAULT_DOSSIER_COUT_LABELS,
  ensureSocieteBrand,
  requireSocieteBrand,
  type DossierCoutLabels,
  type SocieteBrand,
} from "@/lib/societe-brand";
import { htmlEscape } from "@/lib/export/html-escape";
import {
  OFFICIAL_LETTERHEAD_CSS,
  buildOfficialLetterheadHTML,
  documentFooterHTML,
  acquirePrintTarget,
  triggerPrint,
  warnPopupBlocked,
} from "@/lib/export/print-document";
import { fmtFCFA } from "@/lib/export/print-modules/shared";
import {
  SIGNATORIES_BLOCK_CSS,
  buildSignatoriesBlockHTML,
} from "@/lib/export/print-modules/signatories-block";

/* ------------------------------------------------------------------ */
/* printDevis — Document devis/estimation avec en-tête officiel SLTT   */
/* ------------------------------------------------------------------ */

export interface DevisData {
  reference: string;
  clientNom: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  nature: string;
  dateCreation: string;
  dateValidite: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  total: number;
  notes?: string;
  statut?: string;
  /** Intitulés des 3 rubriques de coûts — dépend de l'annexe (Mali/Côte
   * d'Ivoire) du client, ex. « Frais transit port » (manutention portuaire)
   * remplace « Droits de douane » en Côte d'Ivoire. Repli sur les intitulés
   * Mali si non fourni (résout {@link resolveDossierCoutLabels} en amont). */
  coutLabels?: Pick<DossierCoutLabels, "droitDouane" | "fraisCircuit" | "fraisPrestation">;
}

export interface DevisListPrintRow {
  reference: string;
  clientNom: string;
  nature: string;
  total: number;
  dateValidite: string;
  statut: string;
}

function fmtDevisDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtDevisDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function prestataireDisplayName(societe: SocieteBrand): string {
  return societe.raisonSociale || societe.nom;
}

const DEVIS_DOC_BAR_CSS = `
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
.doc-ref {
  font-size: 20px;
  font-weight: 800;
  color: ${BRAND.navy};
  letter-spacing: -0.5px;
  line-height: 1;
}
.doc-date { font-size: 10px; color: #6b7280; margin-top: 4px; }
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
.statut-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: #f1f8fd;
  color: ${BRAND.navy};
  border: 1px solid #c6e1f7;
}`;

export function printDevis(data: DevisData, societe?: SocieteBrand | null): void {
  const resolvedBrand = ensureSocieteBrand(societe);
  const letterheadHTML = buildOfficialLetterheadHTML(resolvedBrand);
  const prestataireNom = prestataireDisplayName(resolvedBrand);

  const coutLabels = data.coutLabels ?? DEFAULT_DOSSIER_COUT_LABELS;
  const items = [
    { label: `${coutLabels.droitDouane} (estimé)`, value: data.droitDouane },
    { label: coutLabels.fraisCircuit, value: data.fraisCircuit },
    { label: coutLabels.fraisPrestation, value: data.fraisPrestation },
  ];

  const rowsHTML = items
    .map(
      (r) => `
    <tr>
      <td class="t-desc">${r.label}</td>
      <td class="t-amount">${fmtFCFA(r.value)}</td>
    </tr>`,
    )
    .join("");

  const clientDetail = [data.clientAdresse, data.clientTelephone, data.clientEmail]
    .filter(Boolean)
    .map((v) => htmlEscape(String(v)))
    .join(" · ");

  const win = acquirePrintTarget();
  if (!win) {
    warnPopupBlocked();
    return;
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Devis ${htmlEscape(data.reference)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #fff;
  color: #263041;
  font-size: 11px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap { max-width: 100%; margin: 0 auto; background: #fff; }

${OFFICIAL_LETTERHEAD_CSS}

/* ── Corps du document ─────────────────────────────────────────── */
.doc { padding: 22px 28px 0; }

.doc-id {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${BRAND.navy};
}
.doc-kind {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: ${BRAND.navy};
}
.doc-no {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: ${BRAND.navy};
  margin-top: 2px;
}
.doc-id-meta { text-align: right; flex-shrink: 0; font-size: 10.5px; color: #6b7280; }
.doc-id-meta > * + * { margin-top: 3px; }

.field-k {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #99a2b2;
  margin-bottom: 4px;
}

/* Parties : deux colonnes séparées par un filet, sans encadré */
.parties { display: flex; padding: 14px 0; border-bottom: 1px solid #e2e6ee; }
.party { flex: 1; padding: 0 20px; }
.party:first-child { padding-left: 0; }
.party:last-child { padding-right: 0; border-left: 1px solid #e2e6ee; }
.party-name { font-size: 14px; font-weight: 700; color: ${BRAND.navy}; }
.party-detail { font-size: 10px; color: #6b7280; margin-top: 4px; line-height: 1.6; }

/* Nature + validité : ligne de définition */
.meta-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e2e6ee; }
.meta-cell { flex: 1; padding-right: 20px; }
.meta-cell:last-child { padding-right: 0; text-align: right; }
.meta-val { font-size: 12px; font-weight: 600; color: #263041; }

/* Tableau des prestations */
.lines { padding-top: 18px; }
.lines-cap {
  font-size: 9px;
  color: #99a2b2;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 7px;
}
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-desc { width: 68%; }
colgroup .c-amount { width: 32%; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 8px 12px;
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  text-align: left;
}
thead th.t-amount { text-align: right; }
tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #e8ebf1;
  font-size: 11px;
}
tbody tr:last-child td { border-bottom: 1px solid #cfd6e2; }
.t-desc { color: #263041; }
.t-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #263041;
  white-space: normal;
  word-break: keep-all;
}

.settle { display: flex; justify-content: flex-end; padding-top: 12px; }
.total-box {
  width: 340px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 11px 14px;
  background: ${BRAND.navy};
  color: #fff;
}
.total-box .lbl { font-size: 12px; font-weight: 700; }
.total-box .amt { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: #fde68a; }

.note-line {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e6ee;
  font-size: 10.5px;
  color: #55617a;
}
.note-line b { color: #263041; font-weight: 700; }
.note-line .field-k { margin-bottom: 4px; }
.note-line p { white-space: pre-wrap; margin-top: 2px; }

${SIGNATORIES_BLOCK_CSS}
.signatories { margin-top: 32px; }

.footer {
  margin-top: 22px;
  padding: 12px 28px 16px;
  border-top: 1px solid #e2e6ee;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 20px;
  color: #99a2b2;
}
.footer-note { font-size: 8.5px; line-height: 1.5; }
.footer-brand { font-size: 9px; font-weight: 700; color: ${BRAND.navy}; white-space: nowrap; }
.no-print { text-align: center; padding: 14px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: ${BRAND.navy}; color: #fff; border: none; padding: 10px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }

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

  <main class="doc">
    <header class="doc-id">
      <div>
        <div class="doc-kind">Devis</div>
        <div class="doc-no">${htmlEscape(data.reference)}</div>
      </div>
      <div class="doc-id-meta">
        <div>Établi le ${fmtDevisDate(data.dateCreation)}</div>
        <div>Valable jusqu'au ${fmtDevisDate(data.dateValidite)}</div>
      </div>
    </header>

    <section class="parties">
      <div class="party">
        <div class="field-k">Prestataire</div>
        <div class="party-name">${htmlEscape(prestataireNom)}</div>
      </div>
      <div class="party">
        <div class="field-k">Client</div>
        <div class="party-name">${htmlEscape(data.clientNom)}</div>
        ${clientDetail ? `<div class="party-detail">${clientDetail}</div>` : ""}
      </div>
    </section>

    <section class="meta-row">
      <div class="meta-cell">
        <div class="field-k">Nature de la marchandise</div>
        <div class="meta-val">${htmlEscape(data.nature)}</div>
      </div>
      <div class="meta-cell">
        <div class="field-k">Période de validité</div>
        <div class="meta-val">${fmtDevisDate(data.dateCreation)} → ${fmtDevisDate(data.dateValidite)}</div>
      </div>
    </section>

    <section class="lines">
      <div class="lines-cap">Montants estimés en francs CFA (FCFA)</div>
      <table>
        <colgroup><col class="c-desc"><col class="c-amount"></colgroup>
        <thead>
          <tr>
            <th>Désignation de la prestation</th>
            <th class="t-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </section>

    <section class="settle">
      <div class="total-box">
        <span class="lbl">Total estimé</span>
        <span class="amt">${fmtFCFA(data.total)}</span>
      </div>
    </section>

    <div class="note-line">
      Ce devis est valable jusqu'au <b>${fmtDevisDate(data.dateValidite)}</b>.
      Passé ce délai, contactez-nous pour renouveler l'estimation.
    </div>

    ${data.notes ? `<div class="note-line"><div class="field-k">Notes &amp; conditions</div><p>${htmlEscape(data.notes)}</p></div>` : ""}

    ${buildSignatoriesBlockHTML()}
  </main>

  <footer class="footer">
    <div class="footer-note">Estimation provisoire · Non contractuel sans signature des deux parties</div>
    <div class="footer-brand">${documentFooterHTML(resolvedBrand.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}

export function printDevisList(
  rows: DevisListPrintRow[],
  filterLabel?: string,
  societe?: SocieteBrand | null,
): void {
  const resolvedBrand = ensureSocieteBrand(societe);
  const letterheadHTML = buildOfficialLetterheadHTML(resolvedBrand);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const totalEstime = rows.reduce((s, r) => s + r.total, 0);

  const sorted = [...rows].sort((a, b) => a.reference.localeCompare(b.reference, "fr"));

  const rowsHTML = sorted
    .map(
      (r, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="col-ref">${htmlEscape(r.reference)}</td>
      <td class="col-client">${htmlEscape(r.clientNom)}</td>
      <td class="col-nature">${htmlEscape(r.nature)}</td>
      <td class="col-amount">${fmtFCFA(r.total)}</td>
      <td class="col-date">${fmtDevisDateShort(r.dateValidite)}</td>
      <td class="col-statut"><span class="statut-pill">${htmlEscape(r.statut)}</span></td>
    </tr>`,
    )
    .join("");

  const win = acquirePrintTarget();
  if (!win) {
    warnPopupBlocked();
    return;
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Liste des devis — ${htmlEscape(resolvedBrand.nom)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #fff;
  color: #1f2937;
  font-size: 11px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap { max-width: 100%; margin: 0 auto; }

${OFFICIAL_LETTERHEAD_CSS}
${DEVIS_DOC_BAR_CSS}

.summary {
  display: flex;
  gap: 0;
  margin: 0 28px 14px;
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  overflow: hidden;
  background: #fafbfc;
}
.summary-item {
  flex: 1;
  padding: 10px 14px;
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
  font-variant-numeric: tabular-nums;
}

.table-section { padding: 0 28px 20px; }
.table-wrap { border: 1px solid #d2dbe9; border-radius: 6px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 7px 8px;
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
}
thead th.col-amount-head { text-align: right; }
tbody td {
  padding: 7px 8px;
  border-bottom: 1px solid #eef1f5;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-even { background: #fff; }
.row-odd { background: #f9fafb; }
.col-ref { font-weight: 700; font-size: 10px; }
.col-client { font-size: 10px; }
.col-nature { font-size: 9.5px; color: #45556b; }
.col-amount { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 10px; }
.col-date { font-size: 9.5px; color: #45556b; }
.col-statut { font-size: 9px; }
.statut-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 9999px;
  background: #eef0fc;
  color: ${BRAND.navy};
  border: 1px solid #c7cbf0;
  font-weight: 700;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
tfoot td {
  background: ${BRAND.navy};
  color: #fff;
  padding: 8px;
  font-weight: 700;
  font-size: 10px;
}
tfoot .total-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #fde68a;
}
.footer {
  padding: 10px 28px 16px;
  border-top: 1px solid #d2dbe9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
}
.footer-note { font-size: 8.5px; color: #92a3ba; }
.footer-brand { font-size: 9.5px; font-weight: 800; color: ${BRAND.navy}; }
.no-print { text-align: center; padding: 14px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: ${BRAND.navy}; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }

@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  .no-print { display: none !important; }
  body { background: white; }
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
        <h1 class="doc-title">Liste des devis</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-date">Édité le ${today}</div>
        ${filterLabel ? `<div class="doc-filter">${htmlEscape(filterLabel)}</div>` : ""}
      </div>
    </div>
  </section>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total devis</div>
      <div class="summary-value">${rows.length}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Montant total estimé</div>
      <div class="summary-value">${fmtFCFA(totalEstime)}</div>
    </div>
  </div>

  <section class="table-section">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Client</th>
            <th>Nature</th>
            <th class="col-amount-head">Total estimé</th>
            <th>Validité</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total — ${rows.length} devis</td>
            <td class="total-amount">${fmtFCFA(totalEstime)}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-note">Document interne · liste des estimations tarifaires</div>
    <div class="footer-brand">${documentFooterHTML(resolvedBrand.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
