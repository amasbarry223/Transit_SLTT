"use client";

import { BRAND } from "@/lib/brand-colors";
import { ensureSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "@/lib/export/html-escape";
import {
  OFFICIAL_LETTERHEAD_CSS,
  buildOfficialLetterheadHTML,
  acquirePrintTarget,
  triggerPrint,
  warnPopupBlocked,
} from "@/lib/export/print-document";

/* ------------------------------------------------------------------ */
/* printFournisseurs — annuaire des prestataires externes              */
/* Même identité visuelle que printTransporteurs / printClients :       */
/* papier à en-tête officiel, bandeau navy, synthèse, table rayée.     */
/* ------------------------------------------------------------------ */

export interface FournisseurPrintRow {
  nom: string;
  type: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  statut: string;
}

export function printFournisseurs(
  rows: FournisseurPrintRow[],
  filterLabel?: string,
  societe?: SocieteBrand | null,
): void {
  const brand = ensureSocieteBrand(societe);
  const letterheadHTML = buildOfficialLetterheadHTML(brand);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const nbActifs = rows.filter((r) => r.statut === "Actif").length;
  const nbInactifs = rows.length - nbActifs;
  const nbTypes = new Set(rows.map((r) => r.type)).size;

  const sorted = [...rows].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const empty = '<span class="empty">—</span>';

  const rowsHTML = sorted
    .map(
      (r, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="col-nom">
        <span class="nom">${htmlEscape(r.nom)}</span>
        ${r.adresse ? `<br><span class="sub">${htmlEscape(r.adresse)}</span>` : ""}
      </td>
      <td class="col-type"><span class="type-badge">${htmlEscape(r.type || "Autre")}</span></td>
      <td class="col-contact">${htmlEscape(r.contact) || empty}</td>
      <td class="col-mono">${htmlEscape(r.telephone) || empty}</td>
      <td class="col-mail">${htmlEscape(r.email) || empty}</td>
      <td class="col-statut"><span class="statut-badge statut-badge--${r.statut === "Actif" ? "on" : "off"}">${htmlEscape(r.statut)}</span></td>
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
<title>Annuaire fournisseurs — ${htmlEscape(brand.nom)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #fff; color: #1f2937; font-size: 12px;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.wrap { max-width: 100%; margin: 0 auto; }

${OFFICIAL_LETTERHEAD_CSS}

.doc-section { padding: 16px 28px 0; }
.doc-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 20px; padding-bottom: 12px;
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
  margin: 0 28px; border: 1px solid #d2dbe9; border-radius: 6px;
  overflow: hidden; background: #fafbfc;
}
.summary-item { padding: 10px 12px; border-right: 1px solid #d2dbe9; }
.summary-item:last-child { border-right: none; }
.summary-label {
  font-size: 7.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #92a3ba; margin-bottom: 4px;
}
.summary-value {
  font-size: 16px; font-weight: 800; color: ${BRAND.navy};
  line-height: 1; font-variant-numeric: tabular-nums;
}
.summary-value--ok { color: #126a32; font-size: 13px; }
.summary-value--warn { color: #b45309; font-size: 13px; }
.summary-hint { font-size: 8.5px; color: #92a3ba; margin-top: 3px; }

.table-section { padding: 14px 28px 20px; }
.table-wrap { border: 1px solid #d2dbe9; border-radius: 6px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-nom { width: 26%; }
colgroup .c-type { width: 14%; }
colgroup .c-contact { width: 15%; }
colgroup .c-tel { width: 14%; }
colgroup .c-mail { width: 21%; }
colgroup .c-statut { width: 10%; }
thead th {
  background: ${BRAND.navy}; color: #fff; padding: 6px 8px;
  font-size: 7.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; text-align: left; white-space: nowrap;
}
tbody td {
  padding: 6px 8px; border-bottom: 1px solid #eef1f5;
  vertical-align: top; overflow: hidden; text-overflow: ellipsis;
}
.row-even { background: #fff; }
.row-odd { background: #f9fafb; }
.nom { font-weight: 700; color: #1f2937; font-size: 10px; }
.sub { color: #92a3ba; font-size: 8px; }
.col-contact { color: #45556b; font-size: 9.5px; white-space: nowrap; }
.col-mono { font-family: ui-monospace, 'Courier New', monospace; color: #45556b; font-size: 9px; white-space: nowrap; }
.col-mail { color: #45556b; font-size: 9px; word-break: break-all; }
.empty { color: #cdd4df; }
.type-badge {
  display: inline-block; font-size: 7px; font-weight: 700; letter-spacing: 0.03em;
  text-transform: uppercase; padding: 1px 6px; border-radius: 9999px;
  color: ${BRAND.navy}; background: #eef0fc; border: 1px solid #c7cbf0; white-space: nowrap;
}
.statut-badge {
  display: inline-block; font-size: 7px; font-weight: 700; letter-spacing: 0.03em;
  text-transform: uppercase; padding: 1px 6px; border-radius: 9999px; white-space: nowrap;
}
.statut-badge--on { color: #126a32; background: #d3f8e1; border: 1px solid #a7e8bf; }
.statut-badge--off { color: #6b7280; background: #f3f5f7; border: 1px solid #d2dbe9; }
tfoot td {
  background: ${BRAND.navy}; color: #fff; padding: 8px;
  font-weight: 700; font-size: 10px;
}

.footer {
  padding: 10px 28px 16px; border-top: 1px solid #d2dbe9;
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
        <h1 class="doc-title">Annuaire fournisseurs</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-date">Édité le ${today}</div>
        <div class="doc-ref">Réf. FRN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</div>
        ${filterLabel ? `<div class="doc-filter">${htmlEscape(filterLabel)}</div>` : ""}
      </div>
    </div>
  </section>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total fournisseurs</div>
      <div class="summary-value">${rows.length}</div>
      <div class="summary-hint">dans cette sélection</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Actifs</div>
      <div class="summary-value summary-value--ok">${nbActifs}</div>
      <div class="summary-hint">prestataires mobilisables</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Inactifs</div>
      <div class="summary-value ${nbInactifs > 0 ? "summary-value--warn" : ""}">${nbInactifs}</div>
      <div class="summary-hint">non mobilisables</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Types couverts</div>
      <div class="summary-value">${nbTypes}</div>
      <div class="summary-hint">catégories de prestation</div>
    </div>
  </div>

  <section class="table-section">
    <div class="table-wrap">
      <table>
        <colgroup>
          <col class="c-nom"><col class="c-type"><col class="c-contact">
          <col class="c-tel"><col class="c-mail"><col class="c-statut">
        </colgroup>
        <thead>
          <tr>
            <th>Prestataire</th>
            <th>Type</th>
            <th>Contact</th>
            <th>Téléphone</th>
            <th>E-mail</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>${rowsHTML || `<tr><td colspan="6" style="padding:16px;text-align:center;color:#92a3ba">Aucun fournisseur</td></tr>`}</tbody>
        <tfoot>
          <tr><td colspan="6">Total — ${rows.length} fournisseur${rows.length !== 1 ? "s" : ""} · ${nbActifs} actif${nbActifs !== 1 ? "s" : ""}</td></tr>
        </tfoot>
      </table>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-note">Document confidentiel · usage interne uniquement</div>
    <div class="footer-brand">${htmlEscape(brand.nom)} · © ${new Date().getFullYear()}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
