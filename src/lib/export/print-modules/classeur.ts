"use client";

import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import {
  brandLogoImgHTML,
  buildBrandSubHTML,
  documentFooterHTML,
  platformFooterHTML,
  triggerPrint,
  warnPopupBlocked,
} from "../print-document";
import { fmtDate, fmtFCFA } from "./shared";

/* ------------------------------------------------------------------ */
/* printClasseur — classeur client (journal unifié + solde cumulé)      */
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

export function printClasseur(
  clientNom: string,
  rows: ClasseurPrintRow[],
  totals: ClasseurPrintTotals,
  filterLabel?: string,
  societe?: SocieteBrand | null,
): void {
  if (!requireSocieteBrand(societe, "le classeur client")) return;
  const logoImg = brandLogoImgHTML(societe);
  const brandSubHTML = buildBrandSubHTML(societe);
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const rowsHTML = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;white-space:nowrap">${fmtDate(r.date)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:11.5px;color:#475569">${htmlEscape(r.societeNom)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:11.5px;color:#475569">${htmlEscape(r.type)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#0f172a;white-space:nowrap">${htmlEscape(r.reference)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569">${htmlEscape(r.libelle)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-size:12px;color:#0f172a">${r.debit > 0 ? fmtFCFA(r.debit) : "—"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-size:12px;color:#15803d">${r.credit > 0 ? fmtFCFA(r.credit) : "—"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-size:12px;font-weight:700;color:${r.soldeCumule > 0 ? "#b45309" : "#15803d"}">${fmtFCFA(r.soldeCumule)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:11.5px;color:#475569">${htmlEscape(r.statut)}</td>
    </tr>`).join("");

  const parSocieteHTML =
    totals.parSociete && totals.parSociete.length > 0
      ? `<div class="societe-totals">
          ${totals.parSociete
            .map(
              (p) =>
                `<div class="societe-total"><span class="societe-total-lbl">${htmlEscape(p.societeNom)}</span><span class="societe-total-val" style="color:${p.soldeNet > 0 ? "#b45309" : "#15803d"}">${fmtFCFA(p.soldeNet)}</span></div>`,
            )
            .join("")}
        </div>`
      : "";

  const win = window.open("", "_blank", "width=1100,height=820");
  if (!win) { warnPopupBlocked(); return; }
  win.opener = null;

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Classeur — ${htmlEscape(clientNom)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 1040px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 44px 28px; border-bottom: 3px solid #1e40af; }
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-title { font-size: 26px; font-weight: 800; color: #1e40af; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.doc-filter { display: inline-block; margin-top: 7px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 9999px; padding: 3px 12px; font-size: 10.5px; font-weight: 700; }
.kpi-band { display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.kpi { flex: 1; padding: 16px 20px; border-right: 1px solid #e2e8f0; }
.kpi:last-child { border-right: none; }
.kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 5px; }
.kpi-val { font-size: 20px; font-weight: 800; color: #1e40af; line-height: 1; }
.tbl-outer { padding: 24px 44px 32px; }
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.tbl-head th:nth-child(6), .tbl-head th:nth-child(7), .tbl-head th:nth-child(8) { text-align: right; }
.societe-totals { display: flex; flex-wrap: wrap; gap: 10px 24px; padding: 14px 44px 0; }
.societe-total { display: flex; align-items: baseline; gap: 8px; font-size: 12px; }
.societe-total-lbl { font-weight: 700; color: #475569; }
.societe-total-val { font-weight: 800; font-variant-numeric: tabular-nums; }
.tbl-foot td { background: #1e3a8a; color: #fff; padding: 12px; font-weight: 700; font-size: 12px; }
.tbl-foot .amt { text-align: right; font-variant-numeric: tabular-nums; color: #fde68a; font-size: 13px; }
.footer { padding: 14px 44px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.footer-note { font-size: 10px; color: #94a3b8; line-height: 1.65; }
.footer-brand { font-size: 11px; font-weight: 800; color: #1e40af; }
.no-print { text-align: center; padding: 16px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print { .no-print { display: none !important; } body { background: white; } .wrap { box-shadow: none; } }
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
      <div>
        ${societe.afficherNomAvecLogo === false ? "" : `<div class="brand-name">${htmlEscape(societe.nom)}</div>`}
        <div class="brand-sub">${brandSubHTML}</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Classeur client</div>
      <div class="doc-title">${htmlEscape(clientNom)}</div>
      <div class="doc-date">Édité le ${today}</div>
      ${filterLabel ? `<div class="doc-filter">${htmlEscape(filterLabel)}</div>` : ""}
    </div>
  </div>
  <div class="kpi-band">
    <div class="kpi"><div class="kpi-lbl">Total débit</div><div class="kpi-val">${fmtFCFA(totals.totalDebit)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Total crédit</div><div class="kpi-val" style="color:#15803d">${fmtFCFA(totals.totalCredit)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Solde net</div><div class="kpi-val" style="color:${totals.soldeNet > 0 ? "#b45309" : "#15803d"}">${fmtFCFA(totals.soldeNet)}</div></div>
  </div>
  <div class="tbl-outer">
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:left">Date</th>
            <th style="text-align:left">Société</th>
            <th style="text-align:left">Type</th>
            <th style="text-align:left">Référence</th>
            <th style="text-align:left">Libellé</th>
            <th>Débit</th>
            <th>Crédit</th>
            <th>Solde</th>
            <th style="text-align:left">Statut</th>
          </tr>
        </thead>
        <tbody>${rowsHTML || `<tr><td colspan="9" style="padding:16px;text-align:center;color:#94a3b8">Aucun mouvement</td></tr>`}</tbody>
        <tfoot class="tbl-foot">
          <tr>
            <td colspan="5">Total &mdash; ${rows.length} mouvement${rows.length !== 1 ? "s" : ""}</td>
            <td class="amt">${fmtFCFA(totals.totalDebit)}</td>
            <td class="amt">${fmtFCFA(totals.totalCredit)}</td>
            <td class="amt">${fmtFCFA(totals.soldeNet)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
  ${parSocieteHTML}
  <div class="footer">
    <div class="footer-note">
      Document confidentiel · usage interne uniquement<br>
      ${platformFooterHTML(societe.nom)}
    </div>
    <div class="footer-brand">${documentFooterHTML(societe.nom)}</div>
  </div>
</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}
