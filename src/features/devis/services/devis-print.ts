"use client";

import { BRAND } from "@/lib/brand-colors";
import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
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
  if (!requireSocieteBrand(societe, "ce devis")) return;
  const letterheadHTML = buildOfficialLetterheadHTML(societe);
  const prestataireNom = prestataireDisplayName(societe);

  const items = [
    { label: "Droits de douane estimés", value: data.droitDouane, color: "#2f91e1" },
    { label: "Frais de circuit global", value: data.fraisCircuit, color: "#7c3aed" },
    { label: "Prestation transit", value: data.fraisPrestation, color: "#ea580c" },
  ];

  const rowsHTML = items
    .map((r) => {
      const pct = data.total > 0 ? Math.round((r.value / data.total) * 100) : 0;
      return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f5f7;vertical-align:top">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${r.color};flex-shrink:0"></span>
          <span style="font-size:13px;color:#1f2937">${r.label}</span>
        </div>
        <div style="height:5px;background:#f3f5f7;border-radius:9999px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${r.color};border-radius:9999px"></div>
        </div>
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #f3f5f7;text-align:center;font-size:11px;color:#92a3ba;width:50px;vertical-align:middle">${pct}%</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f5f7;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:13px;color:#1f2937;width:165px;vertical-align:middle">${fmtFCFA(r.value)}</td>
    </tr>`;
    })
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
<title>Devis ${htmlEscape(data.reference)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #fff;
  color: #1f2937;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap { max-width: 100%; margin: 0 auto; background: #fff; }

${OFFICIAL_LETTERHEAD_CSS}
${DEVIS_DOC_BAR_CSS}

.body { padding: 20px 28px 24px; }
.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
.party { background: #f8fafc; border: 1px solid #d2dbe9; border-radius: 8px; padding: 14px 16px; }
.party-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #92a3ba; margin-bottom: 6px; }
.party-name { font-size: 13px; font-weight: 700; color: #1f2937; }
.party-detail { font-size: 11px; color: #6b7280; margin-top: 4px; line-height: 1.65; }
.nature-block {
  display: flex; align-items: center; gap: 12px;
  background: #f1f8fd; border: 1px solid #c6e1f7; border-radius: 8px;
  padding: 12px 14px; margin-bottom: 20px;
}
.nature-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #93c5fd; margin-bottom: 3px; }
.nature-val { font-size: 13px; font-weight: 700; color: ${BRAND.navy}; }
.nature-icon { font-size: 20px; line-height: 1; }
.tbl-wrap { border: 1px solid #d2dbe9; border-radius: 8px; overflow: hidden; margin-bottom: 6px; }
.tbl-head { background: ${BRAND.navy}; }
.tbl-head th { color: #fff; padding: 9px 14px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.tbl-head th:last-child { text-align: right; }
.tbl-head th:nth-child(2) { text-align: center; width: 50px; }
table { width: 100%; border-collapse: collapse; }
.total-wrap { background: ${BRAND.navy}; border-radius: 8px; overflow: hidden; }
.total-inner { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; }
.total-lbl { font-size: 13px; font-weight: 700; color: #fff; }
.total-amt { font-size: 22px; font-weight: 800; letter-spacing: -1px; font-variant-numeric: tabular-nums; color: #fff; }
.validity { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 11px; color: #374151; line-height: 1.6; }
.validity strong { color: #126a32; }
.notes-block { background: #fafafa; border: 1px solid #d2dbe9; border-radius: 8px; padding: 12px 16px; margin-top: 14px; }
.notes-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #92a3ba; margin-bottom: 6px; }
.notes-text { font-size: 11.5px; color: #45556b; line-height: 1.75; white-space: pre-wrap; }
.sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
.sig-box { border: 1.5px dashed #cdd4df; border-radius: 8px; padding: 16px 14px; min-height: 80px; }
.sig-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #92a3ba; }
.sig-note { font-size: 10px; color: #cdd4df; margin-top: 22px; }
.footer {
  padding: 10px 28px 16px;
  border-top: 1px solid #d2dbe9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
}
.footer-note { font-size: 9px; color: #92a3ba; line-height: 1.5; }
.footer-brand { font-size: 9.5px; font-weight: 800; color: ${BRAND.navy}; }
.no-print { text-align: center; padding: 14px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: ${BRAND.navy}; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }

@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  .no-print { display: none !important; }
  body { background: white; }
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
        <div class="doc-eyebrow">Document commercial</div>
        <h1 class="doc-title">Devis / Estimation</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-ref">${htmlEscape(data.reference)}</div>
        <div class="doc-date">Émis le ${fmtDevisDate(data.dateCreation)}</div>
        <div><span class="statut-badge">${htmlEscape(data.statut ?? "Devis")}</span></div>
      </div>
    </div>
  </section>

  <div class="body">
    <div class="parties">
      <div class="party">
        <div class="party-lbl">Prestataire</div>
        <div class="party-name">${htmlEscape(prestataireNom)}</div>
      </div>
      <div class="party">
        <div class="party-lbl">Client</div>
        <div class="party-name">${htmlEscape(data.clientNom)}</div>
        <div class="party-detail">${[data.clientAdresse, data.clientTelephone, data.clientEmail].filter(Boolean).map(htmlEscape).join("<br>") || "—"}</div>
      </div>
    </div>

    <div class="nature-block">
      <div class="nature-icon">📦</div>
      <div>
        <div class="nature-lbl">Nature de la marchandise</div>
        <div class="nature-val">${htmlEscape(data.nature)}</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div class="nature-lbl">Validité</div>
        <div style="font-size:11px;font-weight:600;color:${BRAND.navy}">${fmtDevisDate(data.dateCreation)} → ${fmtDevisDate(data.dateValidite)}</div>
      </div>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th>Désignation de la prestation</th>
            <th style="text-align:center;width:50px">Part</th>
            <th style="text-align:right;width:165px">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>

    <div class="total-wrap">
      <div class="total-inner">
        <span class="total-lbl">Total estimé</span>
        <span class="total-amt">${fmtFCFA(data.total)}</span>
      </div>
    </div>

    <div class="validity">
      Ce devis est valable jusqu'au <strong>${fmtDevisDate(data.dateValidite)}</strong>.
      Passé ce délai, veuillez nous contacter pour renouveler l'estimation.
    </div>

    ${data.notes ? `
    <div class="notes-block">
      <div class="notes-lbl">Notes &amp; conditions</div>
      <div class="notes-text">${htmlEscape(data.notes)}</div>
    </div>` : ""}

    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-lbl">Signature &amp; cachet du client</div>
        <div class="sig-note">Lu et approuvé</div>
      </div>
      <div class="sig-box">
        <div class="sig-lbl">Cachet &amp; signature ${htmlEscape(societe.nom)}</div>
        <div class="sig-note">Pour la direction</div>
      </div>
    </div>
  </div>

  <footer class="footer">
    <div class="footer-note">Estimation provisoire · Non contractuel sans signature des deux parties</div>
    <div class="footer-brand">${documentFooterHTML(societe.nom)}</div>
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
  if (!requireSocieteBrand(societe, "la liste des devis")) return;
  const letterheadHTML = buildOfficialLetterheadHTML(societe);
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
<title>Liste des devis — ${htmlEscape(societe.nom)}</title>
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
    <div class="footer-brand">${documentFooterHTML(societe.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
