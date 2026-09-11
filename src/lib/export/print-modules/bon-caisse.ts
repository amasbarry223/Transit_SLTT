"use client";

import { BRAND } from "@/lib/brand-colors";
import { ensureSocieteBrand, type SocieteBrand, type SocieteLegalInfo } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import {
  buildLegalLine,
  buildOfficialLetterheadHTML,
  OFFICIAL_LETTERHEAD_CSS,
} from "../print-document";
import { fmtFCFA } from "./shared";
import { SIGNATORIES_BLOCK_CSS, buildSignatoriesBlockHTML } from "./signatories-block";

/* ------------------------------------------------------------------ */
/* BON DE SORTIE DE CAISSE (décaissement) — reproduit le vrai papier   */
/* à en-tête de la société choisie (logo + nom dynamiques ; adresse,   */
/* RCCM, NIF partagés par les sociétés du groupe), avec les deux       */
/* blocs de signature imprimés sur le formulaire physique.             */
/* ------------------------------------------------------------------ */

export interface BonSortieCaisseModuleData {
  reference: string;
  date: string;
  societeNom: string;
  raisonSociale?: string;
  logoUrl?: string;
  /** false si le logo contient déjà le nom en toutes lettres (répéter le nom en texte serait redondant). Défaut true. */
  afficherNomAvecLogo?: boolean;
  legal?: SocieteLegalInfo;
  lignes: Array<{ date: string; beneficiaire: string; motif: string; montant: number }>;
  montantTotal: number;
  /** Noms des signataires (societes.signataire_dg / signataire_pdg) — repli sur les noms historiques si non renseignés. */
  signataireDg?: string;
  signataireReceveur?: string;
  signatairePdg?: string;
}

function bonDataToBrand(data: BonSortieCaisseModuleData): SocieteBrand {
  return ensureSocieteBrand({
    nom: data.societeNom,
    raisonSociale: data.raisonSociale,
    logoUrl: data.logoUrl,
    afficherNomAvecLogo: data.afficherNomAvecLogo,
    legal: data.legal,
  });
}

/** Construit le HTML complet du bon de sortie de caisse (aperçu iframe ou fenêtre d'impression). */
export function buildBonSortieCaisseHTML(data: BonSortieCaisseModuleData): string {
  const brand = bonDataToBrand(data);
  const letterheadHTML = buildOfficialLetterheadHTML(brand);
  const footerLegal = buildLegalLine(data.legal);
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const lignesHTML = data.lignes.map((l) => `
    <tr>
      <td class="t-date">${fmtD(l.date)}</td>
      <td class="t-name">${htmlEscape(l.beneficiaire)}</td>
      <td class="t-motif">${htmlEscape(l.motif)}</td>
      <td class="t-amount">${fmtFCFA(l.montant)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bon de sortie ${htmlEscape(data.reference)}</title>
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

/* ── Corps du document ─────────────────────────────────────────── */
.doc { padding: 22px 40px 0; }
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

.lines { padding-top: 20px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
colgroup .c-date { width: 20%; }
colgroup .c-name { width: 30%; }
colgroup .c-motif { width: 28%; }
colgroup .c-amount { width: 22%; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 8px 13px;
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  text-align: left;
}
thead th.t-amount { text-align: right; }
tbody td {
  padding: 10px 13px;
  border-bottom: 1px solid #e8ebf1;
  font-size: 10.5px;
  vertical-align: top;
}
tbody tr:last-child td { border-bottom: 1px solid #cfd6e2; }
.t-date { color: #55617a; font-variant-numeric: tabular-nums; }
.t-name { color: #263041; font-weight: 600; }
.t-motif { color: #55617a; overflow-wrap: break-word; }
.t-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #263041;
  white-space: normal;
  word-break: keep-all;
}
.t-none { padding: 16px; text-align: center; color: #99a2b2; }

.settle { display: flex; justify-content: flex-end; padding-top: 12px; }
.total-box {
  width: 300px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 10px 13px;
  background: ${BRAND.navy};
  color: #fff;
}
.total-box .lbl { font-size: 12px; font-weight: 700; }
.total-box .amt { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; color: #fde68a; }

${SIGNATORIES_BLOCK_CSS}
.signatories { margin-top: 52px; padding-bottom: 8px; }

.footer {
  padding: 12px 40px 16px;
  border-top: 1px solid #e2e6ee;
  font-size: 9px;
  color: #99a2b2;
  text-align: center;
}
.no-print { text-align: center; padding: 16px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: ${BRAND.navy}; color: #fff; border: none; padding: 10px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  .no-print { display: none !important; }
  body { background: #fff; font-size: 10px; }
  .wrap { box-shadow: none; max-width: 100%; }
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
        <div class="doc-kind">Bon de sortie de caisse</div>
        <div class="doc-no">${htmlEscape(data.reference)}</div>
      </div>
      <div class="doc-id-meta">Établi le ${fmtD(data.date)}</div>
    </header>

    <section class="lines">
      <table>
        <colgroup><col class="c-date"><col class="c-name"><col class="c-motif"><col class="c-amount"></colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Prénom et nom</th>
            <th>Motif</th>
            <th class="t-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${lignesHTML || `<tr><td colspan="4" class="t-none">Aucune ligne</td></tr>`}</tbody>
      </table>
    </section>

    <section class="settle">
      <div class="total-box">
        <span class="lbl">Total décaissé</span>
        <span class="amt">${fmtFCFA(data.montantTotal)}</span>
      </div>
    </section>

    ${buildSignatoriesBlockHTML({
      dg: data.signataireDg,
      receveur: data.signataireReceveur,
      pdg: data.signatairePdg,
    })}
  </main>
  ${footerLegal ? `<div class="footer">${footerLegal}</div>` : ""}
</div>
</body>
</html>`;
}

