"use client";

import { BRAND } from "@/lib/brand-colors";
import {
  requireSocieteBrand,
  type SocieteBrand,
} from "@/lib/societe-brand";
import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
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
import { fmtDate, fmtFCFA, fmtFCFAPlain, shouldShowTva } from "./shared";

/* ------------------------------------------------------------------ */
/* printFactureModule — facture TVA (module Factures)                  */
/* En-tête calqué sur le papier à en-tête officiel (identique à         */
/* l'annuaire clients et au classeur) pour une identité visuelle        */
/* cohérente entre tous les documents imprimés SLTT.                    */
/* Modèle : facture commerciale réelle annexe Côte d'Ivoire (Facture   */
/* N°X, lieu + date d'émission, bloc "Doit", référence, tableau avec   */
/* compagnie/bordereau de livraison, montant en toutes lettres,        */
/* signatures "Pour acquit" / "Directeur Général").                    */
/* ------------------------------------------------------------------ */

export interface FactureModuleData {
  numero: string;
  /** Numéro d'ordre affiché "N°X" — indépendant par annexe (rang de la facture parmi celles de son annexe). */
  annexeSeq?: number;
  clientNom: string;
  /** Ville du siège de l'annexe émettrice — "Abidjan, le [date]". */
  villeSiege?: string;
  date: string;
  dateEcheance: string;
  statut: string;
  lignes: Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
    montantHT: number;
    compagnie?: string;
    bordereauLivraison?: string;
  }>;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  notes: string;
  /** Utilisateur connecté qui télécharge/imprime le PDF maintenant — distinct
   * du créateur historique de la facture (qui peut être quelqu'un d'autre,
   * des mois plus tôt) : "généré" désigne cette action-ci, pas la création. */
  genereParNom: string;
  dossierReference?: string;
  dossierBl?: string;
}

/** Ton du badge de statut — mêmes règles que le classeur client, adaptées aux statuts facture. */
function statutTone(statut: string): "ok" | "warn" | "off" | "neutral" {
  const s = statut.toLowerCase();
  if (/(sold|payé|payée)/.test(s)) return "ok";
  if (/(attente|partiel|envoyée)/.test(s)) return "warn";
  if (/(annul)/.test(s)) return "off";
  return "neutral";
}

export function printFactureModule(data: FactureModuleData, societe?: SocieteBrand | null): void {
  if (!requireSocieteBrand(societe, "cette facture")) return;
  const letterheadHTML = buildOfficialLetterheadHTML(societe);

  const hasLignesDetails = data.lignes.some((l) => l.compagnie || l.bordereauLivraison);
  const numeroAffiche = data.annexeSeq != null ? `N°${data.annexeSeq}` : data.numero;

  const lignesHTML = data.lignes
    .map(
      (l, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="col-num">${i + 1}</td>
      <td class="col-desc">${htmlEscape(l.description)}</td>
      ${
        hasLignesDetails
          ? `<td class="col-compagnie">${l.compagnie ? htmlEscape(l.compagnie) : "<span class='empty'>—</span>"}</td>
      <td class="col-bordereau">${l.bordereauLivraison ? htmlEscape(l.bordereauLivraison) : "<span class='empty'>—</span>"}</td>`
          : ""
      }
      <td class="col-amount">${fmtFCFAPlain(l.montantHT)}</td>
    </tr>`,
    )
    .join("");

  const reste = Math.max(0, data.montantTTC - data.montantPaye);
  const paiementHTML =
    data.montantPaye > 0
      ? `
    <div class="total-line total-line--credit"><span>Déjà payé</span><span>− ${fmtFCFA(data.montantPaye)}</span></div>
    <div class="total-line total-line--warn"><span>Reste à payer</span><span>${fmtFCFA(reste)}</span></div>`
      : "";

  const win = acquirePrintTarget();
  if (!win) { warnPopupBlocked(); return; }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${htmlEscape(numeroAffiche)}</title>
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
  font-size: 24px;
  font-weight: 800;
  color: ${BRAND.navy};
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.doc-meta { text-align: right; flex-shrink: 0; }
.doc-lieu-date { font-size: 11px; color: #6b7280; }
.statut-pill {
  display: inline-block;
  margin-top: 6px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 3px 11px;
  border-radius: 9999px;
}
.statut-pill--ok { color: #126a32; background: #e8f6ec; border: 1px solid #bfe3c9; }
.statut-pill--warn { color: #b45309; background: #fdf3e3; border: 1px solid #f3d9ad; }
.statut-pill--off { color: #6b7280; background: #f3f5f7; border: 1px solid #d2dbe9; }
.statut-pill--neutral { color: ${BRAND.navy}; background: ${BRAND.primaryLight}; border: 1px solid #c7cbf0; }

/* Bloc "Doit" */
.client-section { padding: 12px 28px 0; }
.client-box {
  background: #fafbfc;
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  padding: 12px 16px;
}
.client-lbl {
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #92a3ba;
  margin-bottom: 4px;
}
.client-name { font-size: 15px; font-weight: 800; color: ${BRAND.navy}; }
.client-sub { font-size: 10.5px; color: #6b7280; margin-top: 4px; }

/* Tableau des lignes */
.table-caption {
  padding: 0 1px 6px;
  font-size: 8.5px;
  color: #92a3ba;
  font-style: italic;
}
.table-section { padding: 16px 28px 0; }
.table-wrap {
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-num { width: 6%; }
colgroup .c-desc { width: ${hasLignesDetails ? "38%" : "64%"}; }
colgroup .c-compagnie { width: 16%; }
colgroup .c-bordereau { width: 16%; }
colgroup .c-amount { width: 24%; }
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
thead th.head-num { text-align: center; }
thead th.head-amount { text-align: right; }
tbody td {
  padding: 8px 10px;
  border-bottom: 1px solid #eef1f5;
  border-right: 1px solid #eef1f5;
  vertical-align: middle;
  font-size: 10.5px;
}
tbody td:last-child { border-right: none; }
.row-even { background: #fff; }
.row-odd { background: #f9fafb; }
.col-num { text-align: center; color: #92a3ba; font-variant-numeric: tabular-nums; }
.col-desc { color: #1f2937; }
.col-compagnie, .col-bordereau { color: #45556b; overflow-wrap: break-word; }
.empty { color: #cdd4df; }
/* Jamais d'ellipse/troncature sur un montant — quitte à passer sur 2 lignes
   plutôt que masquer des chiffres. */
.col-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #1f2937;
  white-space: normal;
  word-break: keep-all;
}

/* Totaux */
.totals-section { padding: 16px 28px 0; display: flex; justify-content: flex-end; }
.totals { width: 300px; border: 1px solid #d2dbe9; border-radius: 6px; overflow: hidden; }
.total-line {
  display: flex;
  justify-content: space-between;
  padding: 9px 14px;
  font-size: 12px;
  color: #45556b;
  border-bottom: 1px solid #eef1f5;
  font-variant-numeric: tabular-nums;
}
.total-line--credit { color: #126a32; }
.total-line--warn { color: #b45309; font-weight: 700; }
.total-main {
  background: ${BRAND.navy};
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  border-bottom: none;
}
.total-main span:last-child { color: #fde68a; }

.montant-lettres {
  margin: 16px 28px 0;
  padding: 12px 16px;
  background: #fafbfc;
  border: 1px solid #d2dbe9;
  border-radius: 6px;
  font-size: 11px;
  font-style: italic;
  color: #354253;
}

.notes-section { margin: 16px 28px 0; padding-top: 14px; border-top: 1px solid #d2dbe9; font-size: 11px; color: #6b7280; }
.notes-lbl { font-weight: 700; color: #354253; text-transform: uppercase; font-size: 9px; letter-spacing: 0.08em; }

.sig-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 40px 28px 8px; }
.sig-box { text-align: center; }
.sig-lbl { font-size: 9.5px; font-weight: 700; color: #354253; text-transform: uppercase; letter-spacing: 0.06em; }
.sig-hint { font-size: 8.5px; color: #92a3ba; margin-top: 2px; font-style: italic; }
.sig-space { margin-top: 44px; border-top: 1px solid #cdd4df; }

/* Pied de page */
.footer {
  padding: 14px 28px 16px;
  margin-top: 20px;
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
        <div class="doc-eyebrow">Facture</div>
        <h1 class="doc-title">${htmlEscape(numeroAffiche)}</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-lieu-date">${data.villeSiege ? `${htmlEscape(data.villeSiege)}, le ${fmtDate(data.date)}` : `Le ${fmtDate(data.date)}`}</div>
        <div class="statut-pill statut-pill--${statutTone(data.statut)}">${htmlEscape(data.statut)}</div>
      </div>
    </div>
  </section>

  <section class="client-section">
    <div class="client-box">
      <div class="client-lbl">Doit</div>
      <div class="client-name">${htmlEscape(data.clientNom)}</div>
      ${data.dossierReference ? `<div class="client-sub">Dossier lié : ${htmlEscape(data.dossierReference)}${data.dossierBl ? ` · BL ${htmlEscape(data.dossierBl)}` : ""}</div>` : ""}
    </div>
  </section>

  <section class="table-section">
    <div class="table-caption">Montants en francs CFA (FCFA)</div>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col class="c-num"><col class="c-desc">
          ${hasLignesDetails ? `<col class="c-compagnie"><col class="c-bordereau">` : ""}
          <col class="c-amount">
        </colgroup>
        <thead>
          <tr>
            <th class="head-num">N°</th>
            <th>Désignation</th>
            ${hasLignesDetails ? `<th>Compagnie</th><th>Bordereau de livraison</th>` : ""}
            <th class="head-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${lignesHTML}</tbody>
      </table>
    </div>
  </section>

  <section class="totals-section">
    <div class="totals">
      <div class="total-line"><span>Sous-total HT</span><span>${fmtFCFA(data.montantHT)}</span></div>
      ${shouldShowTva(data.tauxTVA) ? `<div class="total-line"><span>TVA ${data.tauxTVA}%</span><span>${fmtFCFA(data.montantTVA)}</span></div>` : ""}
      <div class="total-line total-main"><span>TOTAL</span><span>${fmtFCFA(data.montantTTC)}</span></div>
      ${paiementHTML}
    </div>
  </section>

  <div class="montant-lettres">Arrêtée la présente facture à la somme de : ${htmlEscape(montantEnLettresFCFA(data.montantTTC))}.</div>

  ${data.notes ? `<div class="notes-section"><span class="notes-lbl">Notes</span><p style="margin-top:6px;white-space:pre-wrap">${htmlEscape(data.notes)}</p></div>` : ""}

  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-lbl">Pour acquit</div>
      <div class="sig-hint">règlement reçu</div>
    </div>
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-lbl">Receveur</div>
      <div class="sig-hint">document remis en main propre</div>
    </div>
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-lbl">Le Directeur Général</div>
    </div>
  </div>

  <footer class="footer">
    <div class="footer-note">Facture générée · ${htmlEscape(data.genereParNom)} · ${fmtDate(new Date().toISOString())}<br>${platformFooterHTML(societe.nom)}</div>
    <div class="footer-brand">${documentFooterHTML(societe.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
