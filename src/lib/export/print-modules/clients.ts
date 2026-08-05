"use client";

import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import {
  brandLogoImgHTML,
  buildBrandSubHTML,
  documentFooterHTML,
  platformFooterHTML,
  acquirePrintTarget,
  triggerPrint,
  warnPopupBlocked,
} from "../print-document";
import { fmtFCFA } from "./shared";

/* ------------------------------------------------------------------ */
/* printClients — annuaire clients avec stats                           */
/* ------------------------------------------------------------------ */

export interface ClientPrintRow {
  nom: string;
  type: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  nbDossiers: number;
  totalDu: number;
}

export function printClients(
  rows: ClientPrintRow[],
  filterLabel?: string,
  societe?: SocieteBrand | null,
): void {
  if (!requireSocieteBrand(societe, "l'annuaire clients")) return;
  const logoImg = brandLogoImgHTML(societe);
  const brandSubHTML = buildBrandSubHTML(societe);
  const today        = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const totalCreance = rows.reduce((s, r) => s + r.totalDu, 0);
  const nbEntreprises  = rows.filter((r) => r.type === "Entreprise").length;
  const nbParticuliers = rows.filter((r) => r.type === "Particulier").length;
  const totalDossiers  = rows.reduce((s, r) => s + r.nbDossiers, 0);

  const initiales = (nom: string) =>
    nom.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const rowsHTML = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:11px 14px;border-bottom:1px solid #f3f5f7;vertical-align:middle">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:${r.type === "Entreprise" ? "linear-gradient(135deg,#2f91e1,#4f46e5)" : "linear-gradient(135deg,#45556b,#232b36)"};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${initiales(r.nom)}</div>
          <div>
            <div style="font-weight:600;color:#1f2937;font-size:13px">${htmlEscape(r.nom)}</div>
            <div style="font-size:10px;color:#92a3ba;margin-top:1px;background:${r.type === "Entreprise" ? "#f1f8fd" : "#f8fafc"};color:${r.type === "Entreprise" ? "#404089" : "#6b7280"};border:1px solid ${r.type === "Entreprise" ? "#c6e1f7" : "#d2dbe9"};display:inline-block;padding:1px 7px;border-radius:9999px;font-weight:600">${r.type}</div>
          </div>
        </div>
      </td>
      <td style="padding:11px 14px;border-bottom:1px solid #f3f5f7;color:#45556b;font-size:12px;vertical-align:middle">${r.telephone ? htmlEscape(r.telephone) : "<span style='color:#cdd4df'>—</span>"}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f3f5f7;color:#45556b;font-size:12px;vertical-align:middle">${r.email ? htmlEscape(r.email) : "<span style='color:#cdd4df'>—</span>"}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f3f5f7;color:#45556b;font-size:12px;vertical-align:middle">${r.adresse ? htmlEscape(r.adresse) : "<span style='color:#cdd4df'>—</span>"}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f3f5f7;text-align:center;font-size:13px;font-weight:600;color:#1f2937;vertical-align:middle">${r.nbDossiers}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f3f5f7;text-align:right;font-variant-numeric:tabular-nums;font-weight:700;font-size:13px;color:${r.totalDu > 0 ? "#b45309" : "#126a32"};vertical-align:middle">${r.totalDu > 0 ? fmtFCFA(r.totalDu) : "Soldé"}</td>
    </tr>`).join("");

  const win = acquirePrintTarget();
  if (!win) { warnPopupBlocked(); return; }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Annuaire clients — SLTT</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1f2937; }
.wrap { max-width: 1000px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #d2dbe9; }

/* Header — fond blanc, logo visible à l'impression */
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 44px 28px; border-bottom: 3px solid #404089; }
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #404089; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #6b7280; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #92a3ba; margin-bottom: 6px; }
.doc-title { font-size: 28px; font-weight: 800; color: #404089; letter-spacing: -1px; line-height: 1; }
.doc-date { font-size: 11px; color: #6b7280; margin-top: 5px; }
.doc-filter { display: inline-block; margin-top: 7px; background: #f1f8fd; color: #404089; border: 1px solid #c6e1f7; border-radius: 9999px; padding: 3px 12px; font-size: 10.5px; font-weight: 700; }

/* KPI band */
.kpi-band { display: flex; gap: 0; background: #f8fafc; border-bottom: 1px solid #d2dbe9; }
.kpi { flex: 1; padding: 18px 20px; border-right: 1px solid #d2dbe9; }
.kpi:last-child { border-right: none; }
.kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #92a3ba; margin-bottom: 5px; }
.kpi-val { font-size: 22px; font-weight: 800; color: #404089; line-height: 1; }
.kpi-sub { font-size: 10px; color: #92a3ba; margin-top: 3px; }

/* Table */
.tbl-outer { padding: 28px 44px 32px; }
.tbl-wrap { border: 1px solid #d2dbe9; border-radius: 10px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #155a93; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.tbl-foot td { background: #155a93; color: #fff; padding: 12px 14px; font-weight: 700; font-size: 13px; }
.tbl-foot .amt { text-align: right; font-variant-numeric: tabular-nums; color: #fde68a; font-size: 15px; }

/* Footer */
.footer { padding: 14px 44px; background: #f8fafc; border-top: 1px solid #d2dbe9; display: flex; justify-content: space-between; align-items: center; }
.footer-note { font-size: 10px; color: #92a3ba; line-height: 1.65; }
.footer-brand { font-size: 11px; font-weight: 800; color: #404089; }

/* Print button */
.no-print { text-align: center; padding: 16px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: #404089; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }

@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
}
</style>
</head>
<body>
<div class="wrap">

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>

  <!-- Header -->
  <div class="doc-header">
    <div class="brand">
      ${logoImg}
      <div>
        ${societe.afficherNomAvecLogo === false ? "" : `<div class="brand-name">${htmlEscape(societe.nom)}</div>`}
        <div class="brand-sub">${brandSubHTML}</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Document interne</div>
      <div class="doc-title">Annuaire clients</div>
      <div class="doc-date">Édité le ${today}</div>
      ${filterLabel ? `<div class="doc-filter">${filterLabel}</div>` : ""}
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpi-band">
    <div class="kpi">
      <div class="kpi-lbl">Total clients</div>
      <div class="kpi-val">${rows.length}</div>
      <div class="kpi-sub">dans cette sélection</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Entreprises</div>
      <div class="kpi-val">${nbEntreprises}</div>
      <div class="kpi-sub">clients professionnels</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Particuliers</div>
      <div class="kpi-val">${nbParticuliers}</div>
      <div class="kpi-sub">clients individuels</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Total dossiers</div>
      <div class="kpi-val">${totalDossiers}</div>
      <div class="kpi-sub">dossiers traités</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Créances totales</div>
      <div class="kpi-val" style="font-size:16px;color:${totalCreance > 0 ? "#b45309" : "#126a32"}">${fmtFCFA(totalCreance)}</div>
      <div class="kpi-sub">reste à encaisser</div>
    </div>
  </div>

  <!-- Table -->
  <div class="tbl-outer">
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:left;width:230px">Client</th>
            <th style="text-align:left;width:120px">Téléphone</th>
            <th style="text-align:left;width:175px">E-mail</th>
            <th style="text-align:left">Adresse</th>
            <th style="text-align:center;width:72px">Dossiers</th>
            <th style="text-align:right;width:145px">Total dû</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
        <tfoot class="tbl-foot">
          <tr>
            <td colspan="4">Total &mdash; ${rows.length} client${rows.length !== 1 ? "s" : ""}</td>
            <td style="text-align:center;color:#fff;font-variant-numeric:tabular-nums">${totalDossiers}</td>
            <td class="amt">${fmtFCFA(totalCreance)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

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
