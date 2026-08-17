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
import { fmtDate, fmtDateShort, fmtFCFA, fmtFCFAPlain } from "./shared";

/* ------------------------------------------------------------------ */
/* printClasseur — classeur client (journal unifié + solde cumulé)      */
/* En-tête calqué sur le papier à en-tête officiel (identique à         */
/* l'annuaire clients) pour une identité visuelle cohérente entre tous  */
/* les documents imprimés SLTT.                                         */
/* ------------------------------------------------------------------ */

export interface ClasseurPrintRow {
  date: string;
  societeNom: string;
  type: string;
  reference: string;
  libelle: string;
  debit: number;
  credit: number;
  soldeCumule: number;
  statut: string;
}

export interface ClasseurPrintTotals {
  totalDebit: number;
  totalCredit: number;
  soldeNet: number;
  parSociete?: Array<{ societeNom: string; soldeNet: number }>;
}

/** Classe de badge par type de mouvement — code couleur cohérent sur tout le document. */
function typeBadgeClass(type: string): string {
  if (type === "Dossier") return "type-badge--dossier";
  if (type === "Paiement") return "type-badge--paiement";
  if (type === "Facture") return "type-badge--facture";
  return "type-badge--autre";
}

/** Ton sémantique du statut (positif/attention/négatif) — détection par mots-clés,
 *  les libellés de statut variant selon la source (dossier, écriture, facture). */
function statutTone(statut: string): "ok" | "warn" | "off" | "neutral" {
  const s = statut.toLowerCase();
  if (/(sold|payé|payée|dédouané|livré|validé)/.test(s)) return "ok";
  if (/(attente|partiel|en cours|brouillon)/.test(s)) return "warn";
  if (/(annul)/.test(s)) return "off";
  return "neutral";
}

export function printClasseur(
  clientNom: string,
  rows: ClasseurPrintRow[],
  totals: ClasseurPrintTotals,
  filterLabel?: string,
  societe?: SocieteBrand | null,
): void {
  if (!requireSocieteBrand(societe, "le classeur client")) return;
  const letterheadHTML = buildOfficialLetterheadHTML(societe);
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const rowsHTML = rows
    .map(
      (r, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="col-date">${fmtDateShort(r.date)}</td>
      <td class="col-societe">${htmlEscape(r.societeNom)}</td>
      <td class="col-type"><span class="type-badge ${typeBadgeClass(r.type)}">${htmlEscape(r.type)}</span></td>
      <td class="col-ref">${htmlEscape(r.reference)}</td>
      <td class="col-libelle">${htmlEscape(r.libelle)}</td>
      <td class="col-amount">${r.debit > 0 ? fmtFCFAPlain(r.debit) : "<span class='empty'>—</span>"}</td>
      <td class="col-amount amount-credit">${r.credit > 0 ? fmtFCFAPlain(r.credit) : "<span class='empty'>—</span>"}</td>
      <td class="col-amount col-solde ${r.soldeCumule > 0 ? "amount-due" : "amount-clear"}">${fmtFCFAPlain(r.soldeCumule)}</td>
      <td class="col-statut"><span class="statut-badge statut-badge--${statutTone(r.statut)}">${htmlEscape(r.statut)}</span></td>
    </tr>`,
    )
    .join("");

  const parSocieteHTML =
    totals.parSociete && totals.parSociete.length > 0
      ? `<div class="societe-totals">
          ${totals.parSociete
            .map(
              (p) =>
                `<div class="societe-total"><span class="societe-total-lbl">${htmlEscape(p.societeNom)}</span><span class="societe-total-val" style="color:${p.soldeNet > 0 ? "#b45309" : "#126a32"}">${fmtFCFA(p.soldeNet)}</span></div>`,
            )
            .join("")}
        </div>`
      : "";

  const win = acquirePrintTarget();
  if (!win) { warnPopupBlocked(); return; }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Classeur — ${htmlEscape(clientNom)}</title>
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

/* Répartition par société */
.societe-totals { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 12px 28px 0; }
.societe-total { display: flex; align-items: baseline; gap: 7px; font-size: 10px; }
.societe-total-lbl { font-weight: 700; color: #45556b; }
.societe-total-val { font-weight: 800; font-variant-numeric: tabular-nums; }

/* Tableau compact A4 portrait */
.table-section { padding: 14px 28px 20px; }
.table-wrap {
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  overflow: hidden;
}
.table-caption {
  padding: 0 1px 6px;
  font-size: 8.5px;
  color: #92a3ba;
  font-style: italic;
}
/* Largeurs calibrées sur le contenu réel de chaque colonne : date compacte
   JJ/MM/AAAA, montants sans suffixe devise (répété une seule fois en légende
   au lieu de chaque cellule) jusqu'à 999 999 999 FCFA. Priorité aux colonnes
   chiffrées — seul Libellé, texte libre, peut tronquer avec ellipse. */
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-date { width: 10%; }
colgroup .c-societe { width: 9%; }
colgroup .c-type { width: 8%; }
colgroup .c-ref { width: 9%; }
colgroup .c-libelle { width: 16%; }
colgroup .c-debit,
colgroup .c-credit { width: 12%; }
colgroup .c-solde { width: 13%; }
colgroup .c-statut { width: 11%; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 6px 7px;
  font-size: 7.5px;
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
  padding: 6px 7px;
  border-bottom: 1px solid #eef1f5;
  border-right: 1px solid #eef1f5;
  vertical-align: middle;
}
tbody td:last-child { border-right: none; }
.row-even { background: #fff; }
.row-odd { background: #f9fafb; }
.col-date { white-space: nowrap; color: #45556b; font-size: 9.5px; }
.col-societe, .col-ref { color: #45556b; font-size: 9.5px; overflow-wrap: break-word; }
.col-ref { font-weight: 700; color: #1f2937; }
/* Seule colonne texte libre autorisée à tronquer — une description longue
   coupée reste lisible, contrairement à un chiffre. */
.col-libelle { color: #45556b; font-size: 9.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Jamais d'ellipse/troncature sur un montant : un chiffre coupé ("1 234 56…")
   peut se lire comme un montant différent — quitte à retomber sur 2 lignes
   plutôt que masquer des chiffres, ce qui n'arrive pas avec les largeurs
   ci-dessus pour des montants réalistes (< 1 milliard FCFA). */
.col-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 10px;
  color: #1f2937;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: keep-all;
}
.amount-credit { color: #126a32; }
.amount-due { color: #b45309; }
.amount-clear { color: #126a32; }
.empty { color: #cdd4df; font-weight: 400; }
.type-badge, .statut-badge {
  display: inline-block;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 9999px;
  white-space: nowrap;
}
.type-badge--dossier { color: ${BRAND.navy}; background: #eef0fc; border: 1px solid #c7cbf0; }
.type-badge--paiement { color: #126a32; background: #e8f6ec; border: 1px solid #bfe3c9; }
.type-badge--facture { color: #155a93; background: #e9f3fb; border: 1px solid #c6e1f7; }
.type-badge--autre { color: #6b7280; background: #f3f5f7; border: 1px solid #d2dbe9; }
.statut-badge--ok { color: #126a32; background: #e8f6ec; border: 1px solid #bfe3c9; }
.statut-badge--warn { color: #b45309; background: #fdf3e3; border: 1px solid #f3d9ad; }
.statut-badge--off { color: #6b7280; background: #f3f5f7; border: 1px solid #d2dbe9; }
.statut-badge--neutral { color: ${BRAND.navy}; background: #eef0fc; border: 1px solid #c7cbf0; }
tfoot td {
  background: ${BRAND.navy};
  color: #fff;
  padding: 8px 7px;
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
        <h1 class="doc-title">Classeur client — ${htmlEscape(clientNom)}</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-date">Édité le ${today}</div>
        <div class="doc-ref">Réf. CLA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</div>
        ${filterLabel ? `<div class="doc-filter">${htmlEscape(filterLabel)}</div>` : ""}
      </div>
    </div>
  </section>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Mouvements</div>
      <div class="summary-value">${rows.length}</div>
      <div class="summary-hint">dans cette sélection</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total débit</div>
      <div class="summary-value">${fmtFCFA(totals.totalDebit)}</div>
      <div class="summary-hint">montants engagés</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total crédit</div>
      <div class="summary-value summary-value--credit">${fmtFCFA(totals.totalCredit)}</div>
      <div class="summary-hint">montants encaissés</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Solde net</div>
      <div class="summary-value ${totals.soldeNet > 0 ? "summary-value--warn" : "summary-value--ok"}">${fmtFCFA(totals.soldeNet)}</div>
      <div class="summary-hint">${totals.soldeNet > 0 ? "reste à encaisser" : "compte soldé"}</div>
    </div>
  </div>

  ${parSocieteHTML}

  <section class="table-section">
    <div class="table-caption">Montants en francs CFA (FCFA)</div>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col class="c-date"><col class="c-societe"><col class="c-type"><col class="c-ref">
          <col class="c-libelle"><col class="c-debit"><col class="c-credit"><col class="c-solde"><col class="c-statut">
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Société</th>
            <th>Type</th>
            <th>Référence</th>
            <th>Libellé</th>
            <th class="head-amount">Débit</th>
            <th class="head-amount">Crédit</th>
            <th class="head-amount">Solde</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>${rowsHTML || `<tr><td colspan="9" style="padding:16px;text-align:center;color:#92a3ba">Aucun mouvement</td></tr>`}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">Total — ${rows.length} mouvement${rows.length !== 1 ? "s" : ""}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.totalDebit)}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.totalCredit)}</td>
            <td class="total-amount">${fmtFCFAPlain(totals.soldeNet)}</td>
            <td></td>
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
