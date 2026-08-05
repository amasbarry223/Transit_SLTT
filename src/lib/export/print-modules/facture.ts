"use client";

import {
  buildInvoiceBrandBlocks,
  requireSocieteBrand,
  type SocieteBrand,
} from "@/lib/societe-brand";
import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import { htmlEscape } from "../html-escape";
import { acquirePrintTarget, triggerPrint, warnPopupBlocked } from "../print-document";
import { fmtFCFA, shouldShowTva } from "./shared";

/* ------------------------------------------------------------------ */
/* printFactureModule — facture TVA (module Factures)                  */
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
  creePar: string;
  creeLe: string;
  dossierReference?: string;
  dossierBl?: string;
}

export function printFactureModule(data: FactureModuleData, societe?: SocieteBrand | null): void {
  if (!requireSocieteBrand(societe, "cette facture")) return;
  const brandBlocks = buildInvoiceBrandBlocks(societe);
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const hasLignesDetails = data.lignes.some((l) => l.compagnie || l.bordereauLivraison);
  const numeroAffiche = data.annexeSeq != null ? `N°${data.annexeSeq}` : data.numero;

  const lignesHTML = data.lignes.map((l, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7;text-align:center;color:#92a3ba">${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7">${htmlEscape(l.description)}</td>
      ${hasLignesDetails ? `
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7">${htmlEscape(l.compagnie ?? "")}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7">${htmlEscape(l.bordereauLivraison ?? "")}</td>` : ""}
      <td style="padding:10px 14px;border-bottom:1px solid #f3f5f7;text-align:right;font-variant-numeric:tabular-nums;font-weight:600">${fmtFCFA(l.montantHT)}</td>
    </tr>`).join("");

  const reste = Math.max(0, data.montantTTC - data.montantPaye);
  const paiementHTML = data.montantPaye > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#126a32">
      <span>Déjà payé</span><span style="font-variant-numeric:tabular-nums">- ${fmtFCFA(data.montantPaye)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:600;color:#b45309">
      <span>Reste à payer</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(reste)}</span>
    </div>` : "";

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
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1f2937; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #d2dbe9; }
.doc-header { display: flex; justify-content: space-between; align-items: center; padding: 30px 40px 26px; border-bottom: 3px solid #404089; }
.brand { display: flex; align-items: center; gap: 20px; min-width: 0; }
.brand--logo-only { flex: 1; max-width: 55%; }
.brand-logo { height: 80px; width: auto; max-width: 420px; object-fit: contain; flex-shrink: 0; }
.brand-name { font-size: 20px; font-weight: 800; color: #404089; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #6b7280; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #92a3ba; margin-bottom: 6px; }
.doc-ref { font-size: 22px; font-weight: 800; color: #404089; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #6b7280; margin-top: 5px; }
.body { padding: 32px 40px; }
.doit-lieu { text-align: right; font-size: 12px; color: #6b7280; margin-bottom: 20px; }
.client-box { background: #f8fafc; border: 1px solid #d2dbe9; border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; }
.client-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #92a3ba; margin-bottom: 6px; }
.client-name { font-size: 15px; font-weight: 700; color: #1f2937; }
.client-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
.tbl-wrap { border: 1px solid #d2dbe9; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #155a93; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.totals { width: 280px; margin-left: auto; }
.total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #45556b; }
.total-main { border-top: 2px solid #1f2937; margin-top: 6px; padding-top: 10px; font-weight: 800; font-size: 15px; color: #404089; }
.montant-lettres { margin-top: 18px; padding: 12px 16px; background: #f8fafc; border: 1px solid #d2dbe9; border-radius: 8px; font-size: 12px; font-style: italic; color: #354253; }
.notes { border-top: 1px solid #d2dbe9; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #6b7280; }
.sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; }
.sig-box { text-align: center; }
.sig-lbl { font-size: 11px; font-weight: 700; color: #354253; text-transform: uppercase; letter-spacing: .05em; }
.sig-space { margin-top: 48px; border-top: 1px solid #cdd4df; }
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #d2dbe9; font-size: 10px; color: #92a3ba; text-align: center; line-height: 1.6; }
.no-print { text-align: center; padding: 18px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: #404089; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
  .brand-logo { height: 72px; max-width: 360px; }
}
</style>
</head>
<body>
<div class="wrap">
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>
  <div class="doc-header">
    ${brandBlocks.headerHTML}
    <div class="doc-meta">
      <div class="doc-type">Facture</div>
      <div class="doc-ref">${htmlEscape(numeroAffiche)}</div>
      <div class="doc-date">Statut : ${htmlEscape(data.statut)}</div>
    </div>
  </div>
  <div class="body">
    ${data.villeSiege ? `<div class="doit-lieu">${htmlEscape(data.villeSiege)}, le ${fmtD(data.date)}</div>` : `<div class="doit-lieu">Le ${fmtD(data.date)}</div>`}
    <div class="client-box">
      <div class="client-lbl">Doit</div>
      <div class="client-name">${htmlEscape(data.clientNom)}</div>
      ${data.dossierReference ? `<div class="client-sub">Dossier lié : ${htmlEscape(data.dossierReference)}${data.dossierBl ? ` · BL ${htmlEscape(data.dossierBl)}` : ""}</div>` : ""}
    </div>
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:center;width:36px">N°</th>
            <th style="text-align:left">Désignation</th>
            ${hasLignesDetails ? `
            <th style="text-align:left">Compagnie</th>
            <th style="text-align:left">Bordereau de livraison</th>` : ""}
            <th style="text-align:right;width:140px">Montant</th>
          </tr>
        </thead>
        <tbody>${lignesHTML}</tbody>
      </table>
    </div>
    <div class="totals">
      <div class="total-line"><span>Sous-total HT</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantHT)}</span></div>
      ${shouldShowTva(data.tauxTVA) ? `<div class="total-line"><span>TVA ${data.tauxTVA}%</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTVA)}</span></div>` : ""}
      <div class="total-line total-main"><span>TOTAL</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTTC)}</span></div>
      ${paiementHTML}
    </div>
    <div class="montant-lettres">Arrêtée la présente facture à la somme de : ${htmlEscape(montantEnLettresFCFA(data.montantTTC))}.</div>
    ${data.notes ? `<div class="notes"><strong style="color:#354253">Notes</strong><p style="margin-top:6px;white-space:pre-wrap">${htmlEscape(data.notes)}</p></div>` : ""}
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-space"></div>
        <div class="sig-lbl">Pour acquit</div>
      </div>
      <div class="sig-box">
        <div class="sig-space"></div>
        <div class="sig-lbl">Le Directeur Général</div>
      </div>
    </div>
  </div>
  <div class="footer">
    Facture générée · ${htmlEscape(societe.nom)} · ${htmlEscape(data.creePar)} · ${fmtD(data.creeLe)}<br>
    ${brandBlocks.footerLegalHTML ? `${brandBlocks.footerLegalHTML}<br>` : ""}
    Merci de votre confiance. Paiement par virement ou espèces.
  </div>
</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
