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
  isCoteIvoire?: boolean;
  annexeCode?: string;
  isProforma?: boolean;
  portTransit?: string;
  nature?: string;
  tonnage?: string;
  typeTransport?: string;
  detailsService?: string;
  conditionPaiement?: string;
}

export function buildCoteIvoireFactureHTML(data: FactureModuleData, resolvedBrand: SocieteBrand): string {
  const numeroAffiche = data.annexeSeq != null ? `0${data.annexeSeq}/26` : data.numero;
  const isProforma = data.isProforma ?? true;
  const titleText = isProforma ? `Facture pro-forma n°${htmlEscape(numeroAffiche)}` : `Facture n°${htmlEscape(numeroAffiche)}`;
  const villeSiege = data.villeSiege || "Abidjan";
  const portTransit = data.portTransit || "ABIDJAN - BAMAKO à partir de la frontière";
  const nature = data.nature || (data.lignes.length > 0 ? data.lignes[0].description : "FER");
  const tonnage = data.tonnage || "56 T";
  const typeTransport = data.typeTransport || "PLATEAU - CAMION";
  const detailsService = data.detailsService || (data.notes ? data.notes : "propositions du coût de dédouanement d'une marchandise.");
  const conditionPaiement = data.conditionPaiement || "PAIEMENT APRES DECHARGEMENT";
  // Corrige un bug latent : signataireDg/signatairePdg n'étaient jusque-là
  // jamais copiés depuis Societe vers SocieteBrand (societe-brand.ts), donc
  // ce fallback était systématiquement pris malgré une configuration saisie
  // dans Paramètres > Société.
  const signataireNom = resolvedBrand.signataireDg || resolvedBrand.signatairePdg || "LAMINE TRAORE";
  const adresseSiege = data.villeSiege?.toLowerCase().includes("abidjan")
    ? (resolvedBrand.legal?.adresse || "Zone Industrielle de Vridi / Treichville, Abidjan")
    : (resolvedBrand.legal?.adresse || "Hamdalaye ACI 2000");
  const telephones = resolvedBrand.legal?.telephone || "+223 76 16 12 01 / +223 44 53 86 11";
  const emailContact = "lamslogistique@gmail.com";

  let lignesRowsHTML = "";
  if (data.lignes && data.lignes.length > 0) {
    lignesRowsHTML = data.lignes.map((l) => {
      const isPort = l.description.toLowerCase().includes("port");
      return `
        <tr>
          <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center;">
            <div style="font-weight: 700; font-size: 11px;">${isPort ? "PORT" : htmlEscape(l.description)}</div>
            ${isPort ? `<div style="font-size: 9px; font-weight: normal; color: #222; margin-top: 2px;">(Emas, Transit, Escort - brigade, machinerie, manœuvre)</div>` : ""}
          </td>
          <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 700; font-size: 11.5px; font-variant-numeric: tabular-nums;">
            ${fmtFCFAPlain(l.montantHT)}
          </td>
        </tr>`;
    }).join("");
  } else {
    lignesRowsHTML = `
      <tr>
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center;">
          <div style="font-weight: 700; font-size: 11px;">PORT</div>
          <div style="font-size: 9px; font-weight: normal; color: #222; margin-top: 2px;">(Emas, Transit, Escort - brigade, machinerie, manœuvre)</div>
        </td>
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 700; font-size: 11.5px;">1 080 000</td>
      </tr>
      <tr>
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 700; font-size: 11px;">Transport</td>
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 700; font-size: 11.5px;">3 800 000</td>
      </tr>
      <tr>
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 700; font-size: 11px;">Dédouanement</td>
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 700; font-size: 11.5px;">7 000 000</td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${htmlEscape(titleText)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  background: #fff;
  color: #000;
  font-size: 11px;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px 24px;
}
.no-print {
  text-align: center;
  padding: 12px;
  background: #f1f5f9;
  border-bottom: 1px solid #cbd5e1;
  margin-bottom: 16px;
}
.btn-print {
  background: #0f3d33;
  color: #fff;
  border: none;
  padding: 9px 24px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
@media print {
  @page { size: A4 portrait; margin: 8mm 10mm 10mm; }
  .no-print { display: none !important; }
  body { background: #fff; }
  .page-container { padding: 0; max-width: 100%; }
  table { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
</div>

<div class="page-container">
  <!-- EN-TETE LAMS CONTROL -->
  <header style="display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-bottom: 10px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      ${
        resolvedBrand.logoUrl
          ? `<img src="${resolvedBrand.logoUrl}" alt="Logo" style="height: 64px; max-width: 130px; object-fit: contain;" />`
          : `<div style="width: 54px; height: 54px; border-radius: 50%; border: 2.5px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
              <span style="font-size: 16px; font-weight: 900; line-height: 1;">LS</span>
              <span style="font-size: 6px; font-weight: 800; text-transform: uppercase;">LOGISTIQUE</span>
            </div>`
      }
      <div>
        <div style="font-size: 26px; font-weight: 900; font-family: 'Arial Black', Impact, sans-serif; letter-spacing: -0.01em; color: #000; line-height: 1.1;">
          ${htmlEscape(resolvedBrand.nom || "LAMS CONTROL SARL")}
        </div>
        <div style="font-size: 13px; font-style: italic; font-weight: 700; color: #111; margin-top: 3px;">
          Voie d'excellence en Transit
        </div>
      </div>
    </div>

    <div style="text-align: left;">
      <ul style="list-style: disc; margin: 0; padding-left: 16px; font-size: 10px; font-weight: 800; color: #000; line-height: 1.45;">
        <li>Transport · Logistique</li>
        <li>Import · Export</li>
        <li>Commerce Général</li>
        <li>Bâtiment et Travaux Publics</li>
        <li>Prestation de service</li>
      </ul>
    </div>
  </header>

  <hr style="border: none; border-top: 2.5px solid #000; margin: 10px 0 20px;" />

  <!-- TITRE FACTURE PRO-FORMA -->
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 17px; font-weight: 800; text-decoration: underline; text-underline-offset: 4px; letter-spacing: 0.02em;">
      ${htmlEscape(titleText)}
    </span>
  </div>

  <!-- BLOC DOIT & DATE -->
  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 22px;">
    <div style="font-size: 12.5px; font-weight: 800; color: #000;">
      Doit : <span style="text-transform: uppercase;">${htmlEscape(data.clientNom)}</span>
    </div>
    <div style="font-size: 11.5px; font-weight: 700; color: #000;">
      ${htmlEscape(villeSiege)}, le ${fmtDate(data.date).replace(/-/g, "-")}
    </div>
  </div>

  <!-- DETAILS DU SERVICE -->
  <div style="margin-bottom: 12px; font-size: 11px; font-weight: 700; color: #000;">
    *Details du service : <span style="font-weight: 500;">${htmlEscape(detailsService)}</span>
  </div>

  <!-- TABLEAU 1 : CARACTERISTIQUES TRANSPORT -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; border: 1.5px solid #000;">
    <thead>
      <tr style="background: #e2e4e8;">
        <th style="border: 1.5px solid #000; padding: 7px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; width: 34%;">PORT DE TRANSIT</th>
        <th style="border: 1.5px solid #000; padding: 7px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; width: 16%;">NATURE</th>
        <th style="border: 1.5px solid #000; padding: 7px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; width: 16%;">DATE</th>
        <th style="border: 1.5px solid #000; padding: 7px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; width: 14%;">TONNAGE</th>
        <th style="border: 1.5px solid #000; padding: 7px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; width: 20%;">TRANSPORT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1.5px solid #000; padding: 8px 6px; font-size: 10.5px; font-weight: 700; text-align: center;">${htmlEscape(portTransit)}</td>
        <td style="border: 1.5px solid #000; padding: 8px 6px; font-size: 10.5px; font-weight: 700; text-align: center; text-transform: uppercase;">${htmlEscape(nature)}</td>
        <td style="border: 1.5px solid #000; padding: 8px 6px; font-size: 10.5px; font-weight: 700; text-align: center;">${fmtDate(data.date).replace(/-/g, " / ").replace(/\//g, " / ")}</td>
        <td style="border: 1.5px solid #000; padding: 8px 6px; font-size: 10.5px; font-weight: 700; text-align: center;">${htmlEscape(tonnage)}</td>
        <td style="border: 1.5px solid #000; padding: 8px 6px; font-size: 10.5px; font-weight: 700; text-align: center; text-transform: uppercase;">${htmlEscape(typeTransport)}</td>
      </tr>
    </tbody>
  </table>

  <!-- TABLEAU 2 : DESIGNATIONS & MONTANT -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1.5px solid #000;">
    <thead>
      <tr style="background: #e2e4e8;">
        <th style="border: 1.5px solid #000; padding: 7px 12px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; text-align: center; width: 68%;">DESIGNATIONS</th>
        <th style="border: 1.5px solid #000; padding: 7px 12px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; text-align: center; width: 32%;">MONTANT</th>
      </tr>
    </thead>
    <tbody>
      ${lignesRowsHTML}
      <tr style="background: #e2e4e8;">
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 800; font-size: 11.5px;">TOTAL</td>
        <td style="border: 1.5px solid #000; padding: 7px 12px; text-align: center; font-weight: 800; font-size: 11.5px; font-variant-numeric: tabular-nums;">${fmtFCFAPlain(data.montantTTC)}</td>
      </tr>
    </tbody>
  </table>

  <!-- NOTE PAIEMENT -->
  <div style="margin-top: 16px; font-size: 11px; font-weight: 800; color: #000;">
    NB : ${htmlEscape(conditionPaiement)}
  </div>

  <!-- BLOC SIGNATURE DIRECTEUR -->
  <div style="margin-top: 32px; display: flex; justify-content: flex-end; padding-right: 36px;">
    <div style="text-align: center; min-width: 190px;">
      <div style="font-size: 11.5px; font-weight: 700; color: #000;">Directeur</div>
      <div style="font-size: 11px; font-weight: 700; color: #000; margin-top: 2px;">${htmlEscape(signataireNom)}</div>
      <div style="height: 75px; display: flex; align-items: center; justify-content: center; position: relative; margin-top: 4px;">
        <div style="width: 76px; height: 76px; border-radius: 50%; border: 1.5px dashed #1e3a8a; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7px; color: #1e3a8a; text-transform: uppercase; font-weight: bold; transform: rotate(-7deg); opacity: 0.85;">
          <span>LAMS CONTROL</span>
          <span style="font-size: 11px;">★ LCS ★</span>
          <span style="font-size: 6px;">Directeur Général</span>
        </div>
        <svg style="position: absolute; width: 95px; height: 50px; opacity: 0.9; stroke: #1e3a8a;" viewBox="0 0 100 50" fill="none">
          <path d="M8 35 C 28 8, 42 45, 62 18 C 74 10, 84 38, 96 22" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M22 38 C 42 34, 68 28, 88 26" stroke="#1e3a8a" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  </div>

  <!-- PIED DE PAGE STYLISE -->
  <footer style="margin-top: 42px; padding-top: 10px; border-top: 1px solid #aaa;">
    <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 9.5px; font-weight: 700; color: #111; padding-bottom: 6px;">
      <div style="line-height: 1.45;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 11px;">📍</span> <span>${htmlEscape(adresseSiege)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
          <span style="font-size: 11px;">📞</span> <span>${htmlEscape(telephones)}</span>
        </div>
      </div>
      <div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 11px;">✉️</span> <span>${htmlEscape(emailContact)}</span>
        </div>
      </div>
    </div>
    <!-- Bande graphique biseautée bicolore en bas de page -->
    <div style="height: 12px; width: 100%; display: flex; gap: 5px; overflow: hidden; margin-top: 4px;">
      <div style="flex: 3; background: #0f3d33; transform: skewX(-35deg); transform-origin: top left;"></div>
      <div style="flex: 1; background: #475569; transform: skewX(-35deg);"></div>
      <div style="flex: 4; background: #0f3d33; transform: skewX(-35deg);"></div>
    </div>
  </footer>
</div>
</body>
</html>`;
}

export function printFactureModule(data: FactureModuleData, societe?: SocieteBrand | null): void {
  const resolvedBrand = ensureSocieteBrand(societe);

  const isCI =
    data.isCoteIvoire ||
    Boolean(
      data.annexeCode &&
        (data.annexeCode.toUpperCase().includes("CI") ||
          data.annexeCode.toUpperCase().includes("ABJ")),
    ) ||
    Boolean(
      data.villeSiege &&
        (data.villeSiege.toLowerCase().includes("abidjan") ||
          data.villeSiege.toLowerCase().includes("ivoire")),
    );

  if (isCI) {
    const html = buildCoteIvoireFactureHTML(data, resolvedBrand);
    const win = acquirePrintTarget();
    if (!win) {
      warnPopupBlocked();
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    triggerPrint(win);
    return;
  }

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
