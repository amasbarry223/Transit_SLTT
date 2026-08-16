"use client";

import { BRAND } from "@/lib/brand-colors";
import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";

import type { ClientPrintRow } from "@/features/clients/types";
import { htmlEscape } from "@/lib/export/html-escape";
import {
  OFFICIAL_LETTERHEAD_CSS,
  buildOfficialLetterheadHTML,
  acquirePrintTarget,
  triggerPrint,
  warnPopupBlocked,
} from "@/lib/export/print-document";
import { fmtFCFA } from "@/lib/export/print-modules/shared";

/* ------------------------------------------------------------------ */
/* printClients — annuaire clients avec stats                           */
/* En-tête calqué sur le papier à en-tête officiel (logo + raison       */
/* sociale + coordonnées légales + double filet).                       */
/* ------------------------------------------------------------------ */

export function printClients(
  rows: ClientPrintRow[],
  filterLabel?: string,
  societe?: SocieteBrand | null,
): void {
  if (!requireSocieteBrand(societe, "l'annuaire clients")) return;
  const letterheadHTML = buildOfficialLetterheadHTML(societe);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const totalCreance = rows.reduce((s, r) => s + r.totalDu, 0);
  const nbEntreprises = rows.filter((r) => r.type === "Entreprise").length;
  const nbParticuliers = rows.filter((r) => r.type === "Particulier").length;
  const totalDossiers = rows.reduce((s, r) => s + r.nbDossiers, 0);

  const sorted = [...rows].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  const rowsHTML = sorted
    .map(
      (r, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="col-client">
        <span class="client-name">${htmlEscape(r.nom)}</span>
      </td>
      <td class="col-type">
        <span class="type-badge type-badge--${r.type === "Entreprise" ? "pro" : "part"}">${htmlEscape(r.type)}</span>
      </td>
      <td class="col-contact">${r.telephone ? htmlEscape(r.telephone) : "<span class='empty'>—</span>"}</td>
      <td class="col-contact">${r.email ? htmlEscape(r.email) : "<span class='empty'>—</span>"}</td>
      <td class="col-adresse">${r.adresse ? htmlEscape(r.adresse) : "<span class='empty'>—</span>"}</td>
      <td class="col-num">${r.nbDossiers}</td>
      <td class="col-amount ${r.totalDu > 0 ? "amount-due" : "amount-clear"}">${r.totalDu > 0 ? fmtFCFA(r.totalDu) : "Soldé"}</td>
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
<title>Annuaire clients — ${htmlEscape(societe.nom)}</title>
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

/* Synthèse chiffrée — 2 lignes pour A4 portrait */
.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 28px;
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  overflow: hidden;
  background: #fafbfc;
}
.summary-item {
  padding: 10px 12px;
  border-right: 1px solid #d2dbe9;
  border-bottom: 1px solid #d2dbe9;
}
.summary-item:nth-child(3n) { border-right: none; }
.summary-item:nth-last-child(-n+2) {
  border-bottom: none;
}
.summary-item:nth-child(4) { grid-column: 1; }
.summary-item:nth-child(5) { grid-column: span 2; border-right: none; }
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
.summary-value--warn { color: #b45309; font-size: 13px; }
.summary-value--ok { color: #126a32; font-size: 13px; }
.summary-hint { font-size: 8.5px; color: #92a3ba; margin-top: 3px; }

/* Tableau compact A4 portrait */
.table-section { padding: 14px 28px 20px; }
.table-wrap {
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 6px 7px;
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
thead th.col-num-head,
thead th.col-amount-head { text-align: right; }
thead th.col-dossiers-head { text-align: center; }
tbody td {
  padding: 6px 7px;
  border-bottom: 1px solid #eef1f5;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-even { background: #fff; }
.row-odd { background: #f9fafb; }
.client-name { font-weight: 700; color: #1f2937; font-size: 10px; }
.col-contact, .col-adresse { color: #45556b; font-size: 9.5px; }
.col-num { text-align: center; font-weight: 600; font-variant-numeric: tabular-nums; font-size: 10px; }
.col-amount { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 10px; }
.amount-due { color: #b45309; }
.amount-clear { color: #126a32; }
.empty { color: #cdd4df; }
.type-badge {
  display: inline-block;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 9999px;
  white-space: nowrap;
}
.type-badge--pro {
  color: ${BRAND.navy};
  background: #eef0fc;
  border: 1px solid #c7cbf0;
}
.type-badge--part {
  color: #6b7280;
  background: #f3f5f7;
  border: 1px solid #d2dbe9;
}
tfoot td {
  background: ${BRAND.navy};
  color: #fff;
  padding: 8px 7px;
  font-weight: 700;
  font-size: 10px;
}
tfoot .total-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #fde68a;
  font-size: 11px;
}
tfoot .total-dossiers {
  text-align: center;
  font-variant-numeric: tabular-nums;
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
        <h1 class="doc-title">Annuaire clients</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-date">Édité le ${today}</div>
        <div class="doc-ref">Réf. CLI-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</div>
        ${filterLabel ? `<div class="doc-filter">${htmlEscape(filterLabel)}</div>` : ""}
      </div>
    </div>
  </section>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total clients</div>
      <div class="summary-value">${rows.length}</div>
      <div class="summary-hint">dans cette sélection</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Entreprises</div>
      <div class="summary-value">${nbEntreprises}</div>
      <div class="summary-hint">clients professionnels</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Particuliers</div>
      <div class="summary-value">${nbParticuliers}</div>
      <div class="summary-hint">clients individuels</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total dossiers</div>
      <div class="summary-value">${totalDossiers}</div>
      <div class="summary-hint">dossiers traités</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Créances totales</div>
      <div class="summary-value ${totalCreance > 0 ? "summary-value--warn" : "summary-value--ok"}">${fmtFCFA(totalCreance)}</div>
      <div class="summary-hint">reste à encaisser</div>
    </div>
  </div>

  <section class="table-section">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Type</th>
            <th>Téléphone</th>
            <th>E-mail</th>
            <th>Adresse</th>
            <th class="col-dossiers-head">Dossiers</th>
            <th class="col-amount-head">Total dû</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">Total — ${rows.length} client${rows.length !== 1 ? "s" : ""}</td>
            <td class="total-dossiers">${totalDossiers}</td>
            <td class="total-amount">${fmtFCFA(totalCreance)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-note">Document confidentiel · usage interne uniquement</div>
    <div class="footer-brand">${htmlEscape(societe.nom)} · © ${new Date().getFullYear()}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
