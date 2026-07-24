"use client";

import {
  buildInvoiceBrandBlocks,
  requireSocieteBrand,
  type SocieteBrand,
} from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import { triggerPrint, warnPopupBlocked } from "../print-document";
import { fmtFCFA, shouldShowTva } from "./shared";

/* ------------------------------------------------------------------ */
/* printFactureModule — facture TVA (module Factures)                  */
/* ------------------------------------------------------------------ */

export interface FactureModuleData {
  numero: string;
  clientNom: string;
  date: string;
  dateEcheance: string;
  statut: string;
  lignes: Array<{ description: string; quantite: number; prixUnitaire: number; montantHT: number }>;
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

  const lignesHTML = data.lignes.map((l, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(l.description)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center;font-variant-numeric:tabular-nums">${l.quantite}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums">${fmtFCFA(l.prixUnitaire)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-weight:600">${fmtFCFA(l.montantHT)}</td>
    </tr>`).join("");

  const reste = Math.max(0, data.montantTTC - data.montantPaye);
  const paiementHTML = data.montantPaye > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#15803d">
      <span>Déjà payé</span><span style="font-variant-numeric:tabular-nums">- ${fmtFCFA(data.montantPaye)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:600;color:#b45309">
      <span>Reste à payer</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(reste)}</span>
    </div>` : "";

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { warnPopupBlocked(); return; }
  win.opener = null;

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${htmlEscape(data.numero)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }
.doc-header { display: flex; justify-content: space-between; align-items: center; padding: 30px 40px 26px; border-bottom: 3px solid #1e40af; }
.brand { display: flex; align-items: center; gap: 20px; min-width: 0; }
.brand--logo-only { flex: 1; max-width: 55%; }
.brand-logo { height: 80px; width: auto; max-width: 420px; object-fit: contain; flex-shrink: 0; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 22px; font-weight: 800; color: #1e40af; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.body { padding: 32px 40px; }
.client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px; }
.client-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 6px; }
.client-name { font-size: 15px; font-weight: 700; color: #0f172a; }
.client-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.totals { width: 280px; margin-left: auto; }
.total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #475569; }
.total-main { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-weight: 800; font-size: 15px; color: #1e40af; }
.notes { border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #64748b; }
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; }
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
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
      <div class="doc-ref">${htmlEscape(data.numero)}</div>
      <div class="doc-date">Date : ${fmtD(data.date)}</div>
      <div class="doc-date">Échéance : ${fmtD(data.dateEcheance)}</div>
      <div class="doc-date">Statut : ${htmlEscape(data.statut)}</div>
    </div>
  </div>
  <div class="body">
    <div class="client-box">
      <div class="client-lbl">Facturé à</div>
      <div class="client-name">${htmlEscape(data.clientNom)}</div>
      ${data.dossierReference ? `<div class="client-sub">Dossier lié : ${htmlEscape(data.dossierReference)}${data.dossierBl ? ` · BL ${htmlEscape(data.dossierBl)}` : ""}</div>` : ""}
    </div>
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:left">Description</th>
            <th style="text-align:center;width:60px">Qté</th>
            <th style="text-align:right;width:130px">P.U. HT</th>
            <th style="text-align:right;width:140px">Montant HT</th>
          </tr>
        </thead>
        <tbody>${lignesHTML}</tbody>
      </table>
    </div>
    <div class="totals">
      <div class="total-line"><span>Sous-total HT</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantHT)}</span></div>
      ${shouldShowTva(data.tauxTVA) ? `<div class="total-line"><span>TVA ${data.tauxTVA}%</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTVA)}</span></div>` : ""}
      <div class="total-line total-main"><span>TOTAL TTC</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTTC)}</span></div>
      ${paiementHTML}
    </div>
    ${data.notes ? `<div class="notes"><strong style="color:#334155">Notes</strong><p style="margin-top:6px;white-space:pre-wrap">${htmlEscape(data.notes)}</p></div>` : ""}
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
