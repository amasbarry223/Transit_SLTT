"use client";

import { BRAND } from "@/lib/brand-colors";
import {
  ensureSocieteBrand,
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
import { SIGNATORIES_BLOCK_CSS, buildSignatoriesBlockHTML } from "./signatories-block";

/* ------------------------------------------------------------------ */
/* printFactureModule — facture TVA (module Factures)                  */
/* Corps du document calqué sur une facture commerciale réelle :       */
/* type + numéro, lieu et date d'émission, bloc « Doit », tableau des  */
/* prestations, décompte à droite, montant en toutes lettres,          */
/* signatures officielles. L'en-tête (buildOfficialLetterheadHTML)     */
/* reste strictement inchangé : seul le corps est mis en forme ici.    */
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
  const resolvedBrand = ensureSocieteBrand(societe);
  const letterheadHTML = buildOfficialLetterheadHTML(resolvedBrand);

  const hasLignesDetails = data.lignes.some((l) => l.compagnie || l.bordereauLivraison);
  const numeroAffiche = data.annexeSeq != null ? `N°${data.annexeSeq}` : data.numero;

  const lignesHTML = data.lignes
    .map(
      (l, i) => `
    <tr>
      <td class="t-num">${i + 1}</td>
      <td class="t-desc">${htmlEscape(l.description)}</td>
      ${
        hasLignesDetails
          ? `<td class="t-sub">${l.compagnie ? htmlEscape(l.compagnie) : "<span class='t-empty'>—</span>"}</td>
      <td class="t-sub">${l.bordereauLivraison ? htmlEscape(l.bordereauLivraison) : "<span class='t-empty'>—</span>"}</td>`
          : ""
      }
      <td class="t-amount">${fmtFCFAPlain(l.montantHT)}</td>
    </tr>`,
    )
    .join("");

  const reste = Math.max(0, data.montantTTC - data.montantPaye);
  const paiementHTML =
    data.montantPaye > 0
      ? `
      <div class="trow trow--credit"><span>Déjà réglé</span><span>− ${fmtFCFA(data.montantPaye)}</span></div>
      <div class="trow trow--due"><span>Reste à payer</span><span>${fmtFCFA(reste)}</span></div>`
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
  color: #263041;
  font-size: 11px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap { max-width: 100%; margin: 0 auto; }

${OFFICIAL_LETTERHEAD_CSS}

/* ── Corps du document ─────────────────────────────────────────── */
.doc { padding: 22px 32px 0; }

/* Identité : type + numéro à gauche, émission à droite, filet navy */
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
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: ${BRAND.navy};
  margin-top: 2px;
}
.doc-id-meta { text-align: right; flex-shrink: 0; font-size: 10.5px; color: #6b7280; }
.doc-id-meta > * + * { margin-top: 3px; }
.chip {
  display: inline-block;
  margin-top: 5px;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  padding: 3px 10px;
  border: 1px solid currentColor;
  border-radius: 2px;
}
.chip--ok { color: #1a7a43; }
.chip--warn { color: #b45309; }
.chip--off { color: #6b7280; }
.chip--neutral { color: ${BRAND.navy}; }

/* Destinataire */
.bill-to { padding: 13px 0; border-bottom: 1px solid #e2e6ee; }
.field-k {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #99a2b2;
  margin-bottom: 4px;
}
.field-v { font-size: 15px; font-weight: 700; color: ${BRAND.navy}; }
.field-note { font-size: 10px; color: #6b7280; margin-top: 4px; }

/* Prestations */
.lines { padding-top: 18px; }
.lines-cap {
  font-size: 9px;
  color: #99a2b2;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 7px;
}
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-num { width: 7%; }
colgroup .c-desc { width: ${hasLignesDetails ? "37%" : "63%"}; }
colgroup .c-compagnie { width: 16%; }
colgroup .c-bordereau { width: 16%; }
colgroup .c-amount { width: ${hasLignesDetails ? "24%" : "30%"}; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 8px 11px;
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  text-align: left;
  white-space: nowrap;
}
thead th.t-num { text-align: center; }
thead th.t-amount { text-align: right; }
tbody td {
  padding: 9px 11px;
  border-bottom: 1px solid #e8ebf1;
  vertical-align: top;
  font-size: 10.5px;
}
tbody tr:last-child td { border-bottom: 1px solid #cfd6e2; }
.t-num { text-align: center; color: #99a2b2; font-variant-numeric: tabular-nums; }
.t-desc { color: #263041; }
.t-sub { color: #55617a; overflow-wrap: break-word; }
.t-empty { color: #c4cbd6; }
/* Jamais d'ellipse sur un montant — quitte à passer sur deux lignes. */
.t-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #263041;
  white-space: normal;
  word-break: keep-all;
}

/* Décompte, aligné à droite sous le tableau */
.settle { display: flex; justify-content: flex-end; padding-top: 14px; }
.totals { width: 340px; }
.trow {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 0;
  font-size: 11px;
  color: #55617a;
  border-bottom: 1px solid #e8ebf1;
  font-variant-numeric: tabular-nums;
}
.trow--credit { color: #1a7a43; }
.trow--due { color: #b45309; font-weight: 700; }
.trow--total {
  margin-top: 5px;
  padding: 10px 12px;
  background: ${BRAND.navy};
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  border-bottom: none;
}
.trow--total span:last-child { color: #fde68a; }

/* Montant en toutes lettres — mention légale, pleine largeur */
.amount-words {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid #e2e6ee;
  font-size: 10.5px;
  font-style: italic;
  color: #3d4759;
}
.amount-words b {
  display: block;
  font-style: normal;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #99a2b2;
  margin-bottom: 3px;
}

.notes {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e6ee;
  font-size: 10.5px;
  color: #55617a;
}
.notes b {
  display: block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #99a2b2;
  margin-bottom: 4px;
}
.notes p { white-space: pre-wrap; }

.sig-wrap { margin: 36px 0 8px; }
${SIGNATORIES_BLOCK_CSS}

.footer {
  margin-top: 22px;
  padding: 12px 32px 16px;
  border-top: 1px solid #e2e6ee;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 20px;
  color: #99a2b2;
}
.footer-note { font-size: 8.5px; line-height: 1.5; }
.footer-brand { font-size: 9px; font-weight: 700; color: ${BRAND.navy}; white-space: nowrap; }

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
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  .no-print { display: none !important; }
  body { background: #fff; font-size: 10px; }
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
        <div class="doc-kind">Facture</div>
        <div class="doc-no">${htmlEscape(numeroAffiche)}</div>
      </div>
      <div class="doc-id-meta">
        <div>${data.villeSiege ? `${htmlEscape(data.villeSiege)}, le ${fmtDate(data.date)}` : `Le ${fmtDate(data.date)}`}</div>
        ${data.dateEcheance ? `<div>Échéance : ${fmtDate(data.dateEcheance)}</div>` : ""}
        <div><span class="chip chip--${statutTone(data.statut)}">${htmlEscape(data.statut)}</span></div>
      </div>
    </header>

    <section class="bill-to">
      <div class="field-k">Doit</div>
      <div class="field-v">${htmlEscape(data.clientNom)}</div>
      ${data.dossierReference ? `<div class="field-note">Dossier lié : ${htmlEscape(data.dossierReference)}${data.dossierBl ? ` · BL ${htmlEscape(data.dossierBl)}` : ""}</div>` : ""}
    </section>

    <section class="lines">
      <div class="lines-cap">Montants en francs CFA (FCFA)</div>
      <table>
        <colgroup>
          <col class="c-num"><col class="c-desc">
          ${hasLignesDetails ? `<col class="c-compagnie"><col class="c-bordereau">` : ""}
          <col class="c-amount">
        </colgroup>
        <thead>
          <tr>
            <th class="t-num">N°</th>
            <th>Désignation</th>
            ${hasLignesDetails ? `<th>Compagnie</th><th>Bordereau de livraison</th>` : ""}
            <th class="t-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${lignesHTML}</tbody>
      </table>
    </section>

    <section class="settle">
      <div class="totals">
        <div class="trow"><span>Sous-total HT</span><span>${fmtFCFA(data.montantHT)}</span></div>
        ${shouldShowTva(data.tauxTVA) ? `<div class="trow"><span>TVA ${data.tauxTVA}%</span><span>${fmtFCFA(data.montantTVA)}</span></div>` : ""}
        <div class="trow trow--total"><span>Total à payer</span><span>${fmtFCFA(data.montantTTC)}</span></div>
        ${paiementHTML}
      </div>
    </section>

    <div class="amount-words">
      <b>Arrêté de la facture</b>
      Arrêtée la présente facture à la somme de : ${htmlEscape(montantEnLettresFCFA(data.montantTTC))}.
    </div>

    ${data.notes ? `<div class="notes"><b>Notes</b><p>${htmlEscape(data.notes)}</p></div>` : ""}

    <div class="sig-wrap">${buildSignatoriesBlockHTML()}</div>
  </main>

  <footer class="footer">
    <div class="footer-note">Facture générée · ${htmlEscape(data.genereParNom)} · ${fmtDate(new Date().toISOString())}<br>${platformFooterHTML(resolvedBrand.nom)}</div>
    <div class="footer-brand">${documentFooterHTML(resolvedBrand.nom)}</div>
  </footer>

</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
