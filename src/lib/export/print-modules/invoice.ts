"use client";

import { resteAPayer } from "@/lib/domain-types";
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

export interface InvoiceData {
  reference: string;
  clientNom: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  nature: string;
  bl?: string;
  date: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti: number;
  montantPaye: number;
  modePaiement?: string;
}

export function printInvoice(data: InvoiceData, invoiceNum: string, societe?: SocieteBrand | null): void {
  if (!requireSocieteBrand(societe, "cette facture dossier")) return;
  const logoImg = brandLogoImgHTML(societe);
  const brandSubHTML = buildBrandSubHTML(societe);
  const reste    = resteAPayer(data);
  const soldé    = reste === 0;
  const today    = fmtDate(new Date().toISOString().slice(0, 10));

  const lignes = [
    { label: "Droits de douane",        montant: data.droitDouane,    color: "#2563eb", bg: "#dbeafe" },
    { label: "Frais de circuit global",  montant: data.fraisCircuit,   color: "#7c3aed", bg: "#ede9fe" },
    { label: "Frais de prestation transit", montant: data.fraisPrestation, color: "#ea580c", bg: "#ffedd5" },
  ];

  const lignesHTML = lignes.map((l) => {
    const pct = data.montantInvesti > 0 ? Math.round((l.montant / data.montantInvesti) * 100) : 0;
    return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${l.color};flex-shrink:0"></span>
          <span style="font-size:13px;color:#0f172a">${l.label}</span>
        </div>
        <div style="height:5px;background:#f1f5f9;border-radius:9999px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${l.color};border-radius:9999px"></div>
        </div>
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;width:50px;vertical-align:middle">${pct}%</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:13px;width:165px;vertical-align:middle">${fmtFCFA(l.montant)}</td>
    </tr>`;
  }).join("");

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { warnPopupBlocked(); return; }
  win.opener = null;

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${invoiceNum}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }

/* Header */
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 40px 28px; border-bottom: 3px solid #1e40af; }
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 28px; font-weight: 800; color: #1e40af; letter-spacing: -1.5px; line-height: 1; }
.doc-dossier { font-size: 12px; color: #64748b; margin-top: 6px; }
.doc-date { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.statut-badge { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.statut-solde { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.statut-partiel { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

/* Body */
.body { padding: 32px 40px; }

/* Parties */
.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
.party { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; }
.party-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 7px; }
.party-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.party-detail { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.7; }

/* Dossier ref block */
.ref-block { display: flex; gap: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 13px 18px; margin-bottom: 22px; flex-wrap: wrap; }
.ref-item { }
.ref-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #93c5fd; margin-bottom: 3px; }
.ref-val { font-size: 13px; font-weight: 700; color: #1e40af; }

/* Table prestations */
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 6px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 16px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }

/* Totaux */
.totals { margin-top: 12px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
.total-line { display: flex; justify-content: space-between; align-items: center; padding: 11px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.total-line:last-child { border-bottom: none; }
.total-main { background: #1e3a8a; color: #fff; }
.total-main .lbl { font-weight: 700; font-size: 14px; }
.total-main .amt { font-size: 22px; font-weight: 800; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
.total-paye .lbl { color: #15803d; font-weight: 600; }
.total-paye .amt { color: #15803d; font-weight: 700; font-variant-numeric: tabular-nums; }
.total-reste .lbl { font-weight: 600; color: #0f172a; }
.total-reste .amt-due { color: #dc2626; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 15px; }
.total-reste .amt-ok  { color: #15803d; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 15px; }

/* Signatures */
.sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 28px; }
.sig-box { border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 16px; min-height: 88px; }
.sig-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; }
.sig-note { font-size: 10.5px; color: #cbd5e1; margin-top: 24px; }

/* Footer */
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.footer-note { font-size: 10px; color: #94a3b8; line-height: 1.65; }
.footer-brand { font-size: 11px; font-weight: 800; color: #1e40af; }

/* Bouton impression */
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }

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
      <div class="doc-type">Facture de transit</div>
      <div class="doc-ref">FACTURE</div>
      <div class="doc-dossier">${htmlEscape(invoiceNum)}</div>
      <div class="doc-date">Émise le ${today}</div>
      <div><span class="statut-badge ${soldé ? "statut-solde" : "statut-partiel"}">${soldé ? "✓ SOLDÉ" : "PAIEMENT PARTIEL"}</span></div>
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

    <!-- Dossier info -->
    <div class="ref-block">
      <div class="ref-item">
        <div class="ref-lbl">Dossier de transit</div>
        <div class="ref-val">${htmlEscape(data.reference)}</div>
      </div>
      <div class="ref-item">
        <div class="ref-lbl">Nature de la marchandise</div>
        <div class="ref-val">${htmlEscape(data.nature)}</div>
      </div>
      ${data.bl ? `<div class="ref-item"><div class="ref-lbl">Connaissement (BL)</div><div class="ref-val">${htmlEscape(data.bl)}</div></div>` : ""}
      ${data.date ? `<div class="ref-item"><div class="ref-lbl">Date du dossier</div><div class="ref-val">${fmtDate(data.date)}</div></div>` : ""}
    </div>

    <!-- Tableau des prestations -->
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:left">Désignation de la prestation</th>
            <th style="text-align:center;width:50px">Part</th>
            <th style="text-align:right;width:165px">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>${lignesHTML}</tbody>
      </table>
    </div>

    <!-- Totaux -->
    <div class="totals">
      <div class="total-line total-main">
        <span class="lbl">Total dossier</span>
        <span class="amt">${fmtFCFA(data.montantInvesti)}</span>
      </div>
      <div class="total-line total-paye">
        <span class="lbl">Montant reçu${data.modePaiement ? ` — ${htmlEscape(data.modePaiement)}` : ""}</span>
        <span class="amt">${fmtFCFA(data.montantPaye)}</span>
      </div>
      <div class="total-line total-reste">
        <span class="lbl">Reste à payer</span>
        <span class="${reste > 0 ? "amt-due" : "amt-ok"}">${fmtFCFA(reste)}</span>
      </div>
    </div>

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

  </div>

  <div class="footer">
    <div class="footer-note">
      Ce document tient lieu de facture provisoire jusqu'à signature des deux parties.<br>
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
