"use client";

import { BRAND } from "@/lib/brand-colors";
import { ensureSocieteBrand, type SocieteBrand, type SocieteLegalInfo } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import {
  buildLegalLine,
  buildOfficialLetterheadHTML,
  OFFICIAL_LETTERHEAD_CSS,
} from "../print-document";

/* ------------------------------------------------------------------ */
/* BON DE LIVRAISON — même papier à en-tête officiel que le bon de     */
/* sortie de caisse ; accompagne la marchandise jusqu'au client et     */
/* revient signé par le réceptionnaire (preuve de livraison).          */
/* ------------------------------------------------------------------ */

export interface BonLivraisonModuleData {
  reference: string;
  date: string;
  bonSortieReference?: string;
  clientNom: string;
  adresseLivraison?: string;
  lignes: Array<{ marchandise: string; quantite: number; unite: string }>;
  transporteurNom?: string;
  immatriculation?: string;
  chauffeurNom?: string;
  chauffeurTelephone?: string;
  observations?: string;
  societeNom: string;
  raisonSociale?: string;
  logoUrl?: string;
  afficherNomAvecLogo?: boolean;
  legal?: SocieteLegalInfo;
}

function toBrand(data: BonLivraisonModuleData): SocieteBrand {
  return ensureSocieteBrand({
    nom: data.societeNom,
    raisonSociale: data.raisonSociale,
    logoUrl: data.logoUrl,
    afficherNomAvecLogo: data.afficherNomAvecLogo,
    legal: data.legal,
  });
}

const fmtQte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 3 });

function field(label: string, value?: string): string {
  return `<div class="f"><span class="f-l">${label}</span><span class="f-v">${value ? htmlEscape(value) : "&nbsp;"}</span></div>`;
}

/** HTML complet du bon de livraison (aperçu iframe ou fenêtre d'impression). */
export function buildBonLivraisonHTML(data: BonLivraisonModuleData): string {
  const letterheadHTML = buildOfficialLetterheadHTML(toBrand(data));
  const footerLegal = buildLegalLine(data.legal);
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const totalColis = data.lignes.reduce((acc, l) => acc + l.quantite, 0);
  const unitesDistinctes = new Set(data.lignes.map((l) => l.unite)).size;

  const lignesHTML = data.lignes
    .map(
      (l, i) => `
    <tr>
      <td class="t-n">${i + 1}</td>
      <td class="t-name">${htmlEscape(l.marchandise)}</td>
      <td class="t-qte">${fmtQte(l.quantite)}</td>
      <td class="t-unit">${htmlEscape(l.unite)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bon de livraison ${htmlEscape(data.reference)}</title>
<style>
${OFFICIAL_LETTERHEAD_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #eef1f5;
  color: #263041;
  font-size: 11px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap { max-width: 780px; margin: 0 auto; background: #fff; box-shadow: 0 1px 4px rgba(31,41,55,0.12); }
.doc { padding: 22px 40px 0; }

.doc-id {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
  padding-bottom: 12px; border-bottom: 2px solid ${BRAND.navy};
}
.doc-kind { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: ${BRAND.navy}; }
.doc-no { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; color: ${BRAND.navy}; margin-top: 2px; }
.doc-id-meta { text-align: right; flex-shrink: 0; font-size: 10.5px; color: #6b7280; line-height: 1.7; }
.doc-id-meta strong { color: #263041; }

.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding-top: 18px; }
.box { border: 1px solid #dfe4ec; border-radius: 6px; padding: 10px 13px; }
.box-t { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 6px; }
.client { font-size: 15px; font-weight: 800; color: ${BRAND.navy}; line-height: 1.2; }
.f { display: flex; gap: 6px; font-size: 10.5px; padding: 2px 0; }
.f-l { color: #6b7280; min-width: 92px; }
.f-v { font-weight: 600; color: #263041; flex: 1; border-bottom: 1px dotted #cfd6e2; }

.lines { padding-top: 18px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-n { width: 8%; } colgroup .c-name { width: 56%; } colgroup .c-qte { width: 18%; } colgroup .c-unit { width: 18%; }
thead th {
  background: ${BRAND.navy}; color: #fff; padding: 8px 13px;
  font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; text-align: left;
}
thead th.t-qte { text-align: right; }
tbody td { padding: 10px 13px; border-bottom: 1px solid #e8ebf1; font-size: 10.5px; vertical-align: top; }
tbody tr:last-child td { border-bottom: 1px solid #cfd6e2; }
.t-n { color: #99a2b2; font-variant-numeric: tabular-nums; }
.t-name { font-weight: 600; overflow-wrap: break-word; }
.t-qte { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.t-unit { color: #55617a; }
.t-none { padding: 16px; text-align: center; color: #99a2b2; }
.total { display: flex; justify-content: flex-end; padding-top: 10px; }
.total-box { display: flex; gap: 16px; align-items: baseline; padding: 8px 13px; background: ${BRAND.navy}; color: #fff; }
.total-box .lbl { font-size: 11px; font-weight: 700; }
.total-box .amt { font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; color: #fde68a; }

.obs { margin-top: 14px; }
.obs .box { min-height: 44px; font-size: 10.5px; white-space: pre-wrap; }

.signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 30px; padding-bottom: 10px; }
.sign { border: 1px solid #dfe4ec; border-radius: 6px; padding: 9px 12px; height: 108px; display: flex; flex-direction: column; }
.sign-t { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: ${BRAND.navy}; }
.sign-h { font-size: 9px; color: #99a2b2; margin-top: 2px; }
.sign-space { flex: 1; }
.sign-l { border-top: 1px dotted #cfd6e2; padding-top: 3px; font-size: 9px; color: #99a2b2; }

.footer { padding: 12px 40px 16px; border-top: 1px solid #e2e6ee; font-size: 9px; color: #99a2b2; text-align: center; }
.no-print { text-align: center; padding: 16px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: ${BRAND.navy}; color: #fff; border: none; padding: 10px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  .no-print { display: none !important; }
  body { background: #fff; font-size: 10px; }
  .wrap { box-shadow: none; max-width: 100%; }
  tr, .sign { page-break-inside: avoid; }
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
        <div class="doc-kind">Bon de livraison</div>
        <div class="doc-no">N° ${htmlEscape(data.reference)}</div>
      </div>
      <div class="doc-id-meta">
        Établi le <strong>${fmtD(data.date)}</strong>
        ${data.bonSortieReference ? `<br>Bon de sortie : <strong>${htmlEscape(data.bonSortieReference)}</strong>` : ""}
      </div>
    </header>

    <section class="parties">
      <div class="box">
        <div class="box-t">Client destinataire</div>
        <div class="client">${htmlEscape(data.clientNom || "—")}</div>
        ${field("Adresse de livraison", data.adresseLivraison)}
      </div>
      <div class="box">
        <div class="box-t">Transport</div>
        ${field("Transporteur", data.transporteurNom)}
        ${field("Immatriculation", data.immatriculation)}
        ${field("Chauffeur", data.chauffeurNom)}
        ${field("Téléphone", data.chauffeurTelephone)}
      </div>
    </section>

    <section class="lines">
      <table>
        <colgroup><col class="c-n"><col class="c-name"><col class="c-qte"><col class="c-unit"></colgroup>
        <thead><tr><th>#</th><th>Désignation de la marchandise</th><th class="t-qte">Quantité</th><th>Unité</th></tr></thead>
        <tbody>${lignesHTML || `<tr><td colspan="4" class="t-none">Aucun article</td></tr>`}</tbody>
      </table>
    </section>
    ${
      // Un total n'a de sens que si toutes les lignes partagent la même unité
      // (additionner des sacs et des cartons ne veut rien dire).
      unitesDistinctes === 1 && data.lignes.length > 1
        ? `<section class="total"><div class="total-box"><span class="lbl">Total livré</span><span class="amt">${fmtQte(totalColis)} ${htmlEscape(data.lignes[0].unite)}</span></div></section>`
        : ""
    }

    ${data.observations ? `<section class="obs"><div class="box-t">Observations</div><div class="box">${htmlEscape(data.observations)}</div></section>` : ""}

    <section class="signs">
      <div class="sign">
        <div class="sign-t">Le livreur</div>
        <div class="sign-h">Nom et signature</div>
        <div class="sign-space"></div>
        <div class="sign-l">Date :</div>
      </div>
      <div class="sign">
        <div class="sign-t">Le réceptionnaire</div>
        <div class="sign-h">Nom, signature — « reçu en bon état »</div>
        <div class="sign-space"></div>
        <div class="sign-l">Date et heure :</div>
      </div>
      <div class="sign">
        <div class="sign-t">Cachet ${htmlEscape(data.societeNom)}</div>
        <div class="sign-h">Visa du responsable</div>
        <div class="sign-space"></div>
      </div>
    </section>
  </main>
  ${footerLegal ? `<div class="footer">${footerLegal}</div>` : ""}
</div>
</body>
</html>`;
}
