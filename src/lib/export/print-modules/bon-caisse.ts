"use client";

import { MISSING_SIGNATORY_LABEL, type SocieteLegalInfo } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import {
  acquirePrintTarget,
  buildLegalLine,
  resolveLogoUrl,
  triggerPrint,
  warnPopupBlocked,
} from "../print-document";
import { fmtFCFA } from "./shared";

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
  logoUrl?: string;
  /** false si le logo contient déjà le nom en toutes lettres (répéter le nom en texte serait redondant). Défaut true. */
  afficherNomAvecLogo?: boolean;
  legal?: SocieteLegalInfo;
  lignes: Array<{ date: string; beneficiaire: string; motif: string; montant: number }>;
  montantTotal: number;
  /** Noms des signataires (societes.signataire_dg / signataire_pdg) — repli sur les noms historiques si non renseignés. */
  signataireDg?: string;
  signatairePdg?: string;
}

/** Construit le HTML complet du bon de sortie de caisse (aperçu iframe ou fenêtre d'impression). */
export function buildBonSortieCaisseHTML(data: BonSortieCaisseModuleData): string {
  const logoUrl = resolveLogoUrl(data.logoUrl);
  const logoImg = logoUrl
    ? `<img src="${logoUrl}" alt="${htmlEscape(data.societeNom)}" class="brand-logo" onerror="this.style.display='none'">`
    : "";
  const footerLegal = buildLegalLine(data.legal);
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const lignesHTML = data.lignes.map((l, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7">${fmtD(l.date)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7">${htmlEscape(l.beneficiaire)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7">${htmlEscape(l.motif)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7;text-align:right;font-variant-numeric:tabular-nums">${fmtFCFA(l.montant)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bon de sortie ${htmlEscape(data.reference)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1f2937; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #d2dbe9; }
.doc-header { display: flex; justify-content: space-between; align-items: center; padding: 26px 40px; border-bottom: 3px solid #404089; gap: 20px; }
.brand { display: flex; align-items: center; gap: 16px; min-width: 0; }
/* Hauteur fixe, largeur libre : le badge circulaire de Traoré Transit Logistique
   (ratio ~1:1) et la bannière large de Top Doumani (ratio ~4:1) doivent tous deux
   rester lisibles — une boîte carrée écraserait la bannière en un filet illisible. */
.brand-logo { height: 60px; width: auto; max-width: 220px; object-fit: contain; flex-shrink: 0; }
.brand-name { font-size: 17px; font-weight: 800; color: #1f2937; letter-spacing: -.3px; line-height: 1.25; text-transform: uppercase; }
.doc-meta { text-align: right; flex-shrink: 0; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #92a3ba; margin-bottom: 6px; }
.doc-ref { font-size: 22px; font-weight: 800; color: #404089; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #6b7280; margin-top: 5px; }
.body { padding: 28px 40px; }
.doc-title { text-align: center; font-size: 16px; font-weight: 800; letter-spacing: .04em; margin-bottom: 22px; }
.tbl-wrap { border: 1px solid #d2dbe9; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #155a93; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.total-line { display: flex; justify-content: flex-end; gap: 24px; padding: 10px 0; font-size: 14px; font-weight: 800; color: #1f2937; }
.signatures { display: flex; justify-content: space-between; margin-top: 64px; }
.sig-block { text-align: center; width: 220px; }
.sig-label { font-size: 11.5px; font-weight: 700; color: #354253; margin-bottom: 48px; }
.sig-name { font-size: 12px; color: #1f2937; border-top: 1px solid #cdd4df; padding-top: 6px; }
.footer { padding: 12px 40px; background: #f8fafc; border-top: 1px solid #d2dbe9; font-size: 10px; color: #45556b; text-align: center; }
.no-print { text-align: center; padding: 18px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: #404089; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
  .brand-logo { height: 52px; max-width: 190px; }
}
</style>
</head>
<body>
<div class="wrap">
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>
  <div class="doc-header">
    <div class="brand">
      ${logoImg}
      ${data.afficherNomAvecLogo === false ? "" : `<div class="brand-name">${htmlEscape(data.societeNom)}</div>`}
    </div>
    <div class="doc-meta">
      <div class="doc-type">Bon de sortie de caisse</div>
      <div class="doc-ref">${htmlEscape(data.reference)}</div>
      <div class="doc-date">Date : ${fmtD(data.date)}</div>
    </div>
  </div>
  <div class="body">
    <div class="doc-title">BON DE SORTIE DE CAISSE ${htmlEscape(data.reference)}</div>
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr><th style="text-align:left">Dates</th><th style="text-align:left">Prénom et Nom</th><th style="text-align:left">Motif</th><th style="text-align:right">Montant</th></tr>
        </thead>
        <tbody>${lignesHTML || `<tr><td colspan="4" style="padding:14px;text-align:center;color:#92a3ba">Aucune ligne</td></tr>`}</tbody>
      </table>
    </div>
    <div class="total-line"><span>Total</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTotal)}</span></div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-label">Directeur Général</div>
        <div class="sig-name">${htmlEscape(data.signataireDg || MISSING_SIGNATORY_LABEL)}</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Visa du PDG</div>
        <div class="sig-name">${htmlEscape(data.signatairePdg || MISSING_SIGNATORY_LABEL)}</div>
      </div>
    </div>
  </div>
  ${footerLegal ? `<div class="footer">${footerLegal}</div>` : ""}
</div>
</body>
</html>`;
}

/** Ouvre une fenêtre dédiée et déclenche l'impression (compat). Préférer l'aperçu intégré. */
export function printBonSortieCaisseModule(data: BonSortieCaisseModuleData): boolean {
  const html = buildBonSortieCaisseHTML(data);
  const win = acquirePrintTarget();
  if (!win) {
    warnPopupBlocked();
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  triggerPrint(win);
  return true;
}
