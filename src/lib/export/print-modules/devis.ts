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
import { fmtFCFA } from "./shared";

/* ------------------------------------------------------------------ */
/* printDevis — Document devis/estimation avec logo SLTT               */
/* ------------------------------------------------------------------ */

export interface DevisData {
  reference: string;
  clientNom: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  nature: string;
  dateCreation: string;
  dateValidite: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  total: number;
  notes?: string;
  statut?: string;
}

export function printDevis(data: DevisData, societe?: SocieteBrand | null): void {
  if (!requireSocieteBrand(societe, "ce devis")) return;
  const brandSubHTML = buildBrandSubHTML(societe);
  const logoImg = brandLogoImgHTML(societe);
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const items = [
    { label: "Droits de douane estimés", value: data.droitDouane,    color: "#2563eb", bg: "#dbeafe" },
    { label: "Frais de circuit global",  value: data.fraisCircuit,   color: "#7c3aed", bg: "#ede9fe" },
    { label: "Prestation transit",         value: data.fraisPrestation, color: "#ea580c", bg: "#ffedd5" },
  ];

  const rowsHTML = items.map((r) => {
    const pct = data.total > 0 ? Math.round((r.value / data.total) * 100) : 0;
    return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${r.color};flex-shrink:0"></span>
          <span style="font-size:13px;color:#0f172a">${r.label}</span>
        </div>
        <div style="height:5px;background:#f1f5f9;border-radius:9999px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${r.color};border-radius:9999px"></div>
        </div>
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;width:50px;vertical-align:middle">${pct}%</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:13px;color:#0f172a;width:165px;vertical-align:middle">${fmtFCFA(r.value)}</td>
    </tr>`;
  }).join("");

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { warnPopupBlocked(); return; }
  win.opener = null;

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Devis ${data.reference}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }

/* ── Header (fond blanc, logo visible à l'impression) ── */
.doc-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 36px 40px 28px;
  border-bottom: 3px solid #1e40af;
}
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 30px; font-weight: 800; color: #1e40af; letter-spacing: -1.5px; line-height: 1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.statut-badge {
  display: inline-block; margin-top: 8px;
  padding: 4px 12px; border-radius: 9999px;
  font-size: 11px; font-weight: 700; letter-spacing: .04em;
  background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;
}

/* ── Body ── */
.body { padding: 32px 40px; }

/* Parties */
.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.party { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; }
.party-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 7px; }
.party-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.party-detail { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.7; }

/* Nature */
.nature-block {
  display: flex; align-items: center; gap: 12px;
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
  padding: 13px 16px; margin-bottom: 24px;
}
.nature-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #93c5fd; margin-bottom: 3px; }
.nature-val { font-size: 14px; font-weight: 700; color: #1e40af; }
.nature-icon { font-size: 22px; line-height: 1; }

/* Table */
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 6px; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 16px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.tbl-head th:last-child { text-align: right; }
.tbl-head th:nth-child(2) { text-align: center; width: 50px; }
table { width: 100%; border-collapse: collapse; }

/* Total */
.total-wrap { background: #1e3a8a; border-radius: 10px; overflow: hidden; }
.total-inner { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; }
.total-lbl { font-size: 14px; font-weight: 700; color: #fff; }
.total-amt { font-size: 24px; font-weight: 800; letter-spacing: -1px; font-variant-numeric: tabular-nums; color: #fff; }

/* Validity */
.validity { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 13px 18px; margin-top: 20px; font-size: 12px; color: #374151; line-height: 1.65; }
.validity strong { color: #15803d; }

/* Notes */
.notes-block { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-top: 16px; }
.notes-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 8px; }
.notes-text { font-size: 12.5px; color: #475569; line-height: 1.8; white-space: pre-wrap; }

/* Signatures */
.sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
.sig-box { border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 18px 16px; min-height: 88px; }
.sig-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; }
.sig-note { font-size: 10.5px; color: #cbd5e1; margin-top: 24px; }

/* Footer */
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.footer-note { font-size: 10px; color: #94a3b8; line-height: 1.65; }
.footer-brand { font-size: 11px; font-weight: 800; color: #1e40af; }

/* Bouton impression (caché à l'impression) */
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; letter-spacing: .01em; }

@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
  .brand-logo { width: 56px; height: 56px; }
}
</style>
</head>
<body>
<div class="wrap">

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>

  <!-- En-tête blanc avec logo visible à l'impression -->
  <div class="doc-header">
    <div class="brand">
      ${logoImg}
      <div>
        ${societe.afficherNomAvecLogo === false ? "" : `<div class="brand-name">${htmlEscape(societe.nom)}</div>`}
        <div class="brand-sub">${brandSubHTML}</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Devis / Estimation</div>
      <div class="doc-ref">${htmlEscape(data.reference)}</div>
      <div class="doc-date">Émis le ${fmtD(data.dateCreation)}</div>
      <div><span class="statut-badge">${htmlEscape(data.statut ?? "Devis")}</span></div>
    </div>
  </div>

  <div class="body">

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <div class="party-lbl">Prestataire</div>
        <div class="party-name">${htmlEscape(societe.nom)}</div>
        <div class="party-detail">${brandSubHTML}</div>
      </div>
      <div class="party">
        <div class="party-lbl">Client</div>
        <div class="party-name">${htmlEscape(data.clientNom)}</div>
        <div class="party-detail">${[data.clientAdresse, data.clientTelephone, data.clientEmail].filter(Boolean).map(htmlEscape).join("<br>") || "—"}</div>
      </div>
    </div>

    <!-- Nature -->
    <div class="nature-block">
      <div class="nature-icon">📦</div>
      <div>
        <div class="nature-lbl">Nature de la marchandise</div>
        <div class="nature-val">${htmlEscape(data.nature)}</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div class="nature-lbl">Validité</div>
        <div style="font-size:12px;font-weight:600;color:#1e40af">${fmtD(data.dateCreation)} → ${fmtD(data.dateValidite)}</div>
      </div>
    </div>

    <!-- Tableau des prestations -->
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th>Désignation de la prestation</th>
            <th style="text-align:center;width:50px">Part</th>
            <th style="text-align:right;width:165px">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>

    <!-- Total -->
    <div class="total-wrap">
      <div class="total-inner">
        <span class="total-lbl">Total estimé</span>
        <span class="total-amt">${fmtFCFA(data.total)}</span>
      </div>
    </div>

    <!-- Validité -->
    <div class="validity">
      ✅ &nbsp;Ce devis est valable jusqu'au <strong>${fmtD(data.dateValidite)}</strong>.
      Passé ce délai, veuillez nous contacter pour renouveler l'estimation.
    </div>

    ${data.notes ? `
    <div class="notes-block">
      <div class="notes-lbl">Notes &amp; conditions</div>
      <div class="notes-text">${htmlEscape(data.notes)}</div>
    </div>` : ""}

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-lbl">Signature &amp; cachet du client</div>
        <div class="sig-note">Lu et approuvé</div>
      </div>
      <div class="sig-box">
        <div class="sig-lbl">Cachet &amp; signature ${htmlEscape(societe.nom)}</div>
        <div class="sig-note">Pour la direction</div>
      </div>
    </div>

  </div><!-- /body -->

  <div class="footer">
    <div class="footer-note">
      Estimation provisoire · Non contractuel sans signature des deux parties<br>
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
