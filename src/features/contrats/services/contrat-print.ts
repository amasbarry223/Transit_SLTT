"use client";

import { BRAND } from "@/lib/brand-colors";
import { ensureSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "@/lib/export/html-escape";
import {
  OFFICIAL_LETTERHEAD_CSS,
  buildOfficialLetterheadHTML,
  documentFooterHTML,
  acquirePrintTarget,
  triggerPrint,
  warnPopupBlocked,
} from "@/lib/export/print-document";
import { fmtFCFA, fmtDate } from "@/lib/export/print-modules/shared";
import {
  SIGNATORIES_BLOCK_CSS,
  buildSignatoriesBlockHTML,
} from "@/lib/export/print-modules/signatories-block";

/* ------------------------------------------------------------------ */
/* printContrat — Document contrat d'entreposage avec en-tête officiel  */
/* SLTT. Même identité visuelle que printDevis (papier à en-tête,       */
/* bandeau "parties", tableaux de lignes, total, signatures) — pas de   */
/* statut coloré (cohérent avec la suppression des badges/chips sur     */
/* les autres PDF de cette session).                                   */
/* ------------------------------------------------------------------ */

export interface ContratPrestationPrintRow {
  libelle: string;
  description?: string;
  montant?: number;
  statut: string;
}

export interface ContratDepensePrintRow {
  libelle: string;
  montant: number;
  dateDepense: string;
  modePaiement: string;
}

export interface ContratPrintData {
  reference: string;
  clientNom: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  objet: string;
  dateDebut: string;
  dateFin?: string;
  montant: number;
  statut: string;
  notes?: string;
  prestations: ContratPrestationPrintRow[];
  depenses: ContratDepensePrintRow[];
  totalDepenses: number;
}

function prestataireDisplayName(societe: SocieteBrand): string {
  return societe.raisonSociale || societe.nom;
}

export function printContrat(data: ContratPrintData, societe?: SocieteBrand | null): void {
  const resolvedBrand = ensureSocieteBrand(societe);
  const letterheadHTML = buildOfficialLetterheadHTML(resolvedBrand);
  const prestataireNom = prestataireDisplayName(resolvedBrand);

  const clientDetail = [data.clientAdresse, data.clientTelephone, data.clientEmail]
    .filter(Boolean)
    .map((v) => htmlEscape(String(v)))
    .join(" · ");

  const dureeLabel = data.dateFin
    ? `${fmtDate(data.dateDebut)} → ${fmtDate(data.dateFin)}`
    : `${fmtDate(data.dateDebut)} → durée indéterminée`;

  const prestationsRowsHTML = data.prestations.length
    ? data.prestations
        .map(
          (p) => `
    <tr>
      <td class="t-desc">${htmlEscape(p.libelle)}${p.description ? `<br><span class="t-sub">${htmlEscape(p.description)}</span>` : ""}</td>
      <td class="t-statut">${htmlEscape(p.statut)}</td>
      <td class="t-amount">${p.montant ? fmtFCFA(p.montant) : '<span class="empty">—</span>'}</td>
    </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="t-empty">Aucune prestation optionnelle</td></tr>`;

  const depensesRowsHTML = data.depenses.length
    ? data.depenses
        .map(
          (d) => `
    <tr>
      <td class="t-desc">${htmlEscape(d.libelle)}</td>
      <td class="t-mode">${htmlEscape(d.modePaiement)}</td>
      <td class="t-date">${fmtDate(d.dateDepense)}</td>
      <td class="t-amount">${fmtFCFA(d.montant)}</td>
    </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="t-empty">Aucune dépense enregistrée</td></tr>`;

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
<title>Contrat ${htmlEscape(data.reference)}</title>
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

/* Objet + durée + statut : ligne de définition */
.meta-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e2e6ee; }
.meta-cell { flex: 1; padding-right: 20px; }
.meta-cell:last-child { padding-right: 0; text-align: right; }
.meta-val { font-size: 12px; font-weight: 600; color: #263041; }

.objet-line { padding: 12px 0; border-bottom: 1px solid #e2e6ee; }
.objet-line .meta-val { font-weight: 500; white-space: pre-wrap; }

/* Tableaux (prestations, dépenses) */
.lines { padding-top: 18px; }
.lines-cap {
  font-size: 9px;
  color: #99a2b2;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 7px;
}
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.tbl-prestations colgroup .c-desc { width: 56%; }
.tbl-prestations colgroup .c-statut { width: 20%; }
.tbl-prestations colgroup .c-amount { width: 24%; }
.tbl-depenses colgroup .c-desc { width: 40%; }
.tbl-depenses colgroup .c-mode { width: 20%; }
.tbl-depenses colgroup .c-date { width: 18%; }
.tbl-depenses colgroup .c-amount { width: 22%; }
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
.t-sub { color: #99a2b2; font-size: 9.5px; }
.t-statut, .t-mode, .t-date { color: #55617a; font-size: 10px; }
.t-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #263041;
  white-space: normal;
  word-break: keep-all;
}
.t-empty { text-align: center; color: #99a2b2; font-style: italic; }
.empty { color: #cdd4df; }

.settle { display: flex; justify-content: flex-end; gap: 10px; padding-top: 12px; flex-direction: column; align-items: flex-end; }
.total-box {
  width: 340px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 11px 14px;
}
.total-box.total-box--main { background: ${BRAND.navy}; color: #fff; }
.total-box.total-box--main .amt { color: #fde68a; }
.total-box.total-box--sub { background: #f3f5f9; color: ${BRAND.navy}; border: 1px solid #e2e6ee; }
.total-box.total-box--sub .amt { color: ${BRAND.navy}; }
.total-box .lbl { font-size: 12px; font-weight: 700; }
.total-box .amt { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

.note-line {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e6ee;
  font-size: 10.5px;
  color: #55617a;
}
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
        <div class="doc-kind">Contrat</div>
        <div class="doc-no">${htmlEscape(data.reference)}</div>
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

    <div class="objet-line">
      <div class="field-k">Objet du contrat</div>
      <div class="meta-val">${htmlEscape(data.objet)}</div>
    </div>

    <section class="meta-row">
      <div class="meta-cell">
        <div class="field-k">Durée du contrat</div>
        <div class="meta-val">${dureeLabel}</div>
      </div>
      <div class="meta-cell">
        <div class="field-k">Statut</div>
        <div class="meta-val">${htmlEscape(data.statut)}</div>
      </div>
    </section>

    <section class="lines">
      <div class="lines-cap">Prestations optionnelles</div>
      <table class="tbl-prestations">
        <colgroup><col class="c-desc"><col class="c-statut"><col class="c-amount"></colgroup>
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Statut</th>
            <th class="t-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${prestationsRowsHTML}</tbody>
      </table>
    </section>

    <section class="lines">
      <div class="lines-cap">Dépenses engagées</div>
      <table class="tbl-depenses">
        <colgroup><col class="c-desc"><col class="c-mode"><col class="c-date"><col class="c-amount"></colgroup>
        <thead>
          <tr>
            <th>Libellé</th>
            <th>Mode de paiement</th>
            <th>Date</th>
            <th class="t-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${depensesRowsHTML}</tbody>
      </table>
    </section>

    <section class="settle">
      ${data.totalDepenses > 0 ? `
      <div class="total-box total-box--sub">
        <span class="lbl">Total dépenses engagées</span>
        <span class="amt">${fmtFCFA(data.totalDepenses)}</span>
      </div>` : ""}
      <div class="total-box total-box--main">
        <span class="lbl">Montant du contrat</span>
        <span class="amt">${fmtFCFA(data.montant)}</span>
      </div>
    </section>

    ${data.notes ? `<div class="note-line"><div class="field-k">Notes</div><p>${htmlEscape(data.notes)}</p></div>` : ""}

    ${buildSignatoriesBlockHTML()}
  </main>

  <footer class="footer">
    <div class="footer-note">Document contractuel · usage interne et archivage</div>
    <div class="footer-brand">${documentFooterHTML(resolvedBrand.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
