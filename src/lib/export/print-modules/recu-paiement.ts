"use client";

import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import {
  RECEIPT_BLUE,
  RECEIPT_HEIGHT_MM,
  RECEIPT_PAPER,
  RECEIPT_WIDTH_MM,
} from "@/lib/recus-paiement-styles";
import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import { acquirePrintTarget, resolveLogoUrl, triggerPrint, warnPopupBlocked } from "../print-document";
import { fmtDate, fmtFCFA } from "./shared";

/* ------------------------------------------------------------------ */
/* Reçu de paiement — format horizontal (carnet papier TRAORE)         */
/* ------------------------------------------------------------------ */

export interface RecuPaiementModuleData {
  date: string;
  nom: string;
  prenom: string;
  somme: number;
  motif: string;
  montantPaye: number;
  reste: number;
  signature?: string;
}

function buildHeaderLegalHTML(brand: SocieteBrand): string {
  const parts: string[] = [];
  if (brand.legal?.adresse) parts.push(htmlEscape(brand.legal.adresse));
  if (brand.legal?.rccm) parts.push(`RCCM : ${htmlEscape(brand.legal.rccm)}`);
  if (brand.legal?.telephone) parts.push(`Tél. : ${htmlEscape(brand.legal.telephone)}`);
  return parts.map((line) => `<div class="header-legal-line">${line}</div>`).join("");
}

function buildFieldLine(label: string, value: string, className = ""): string {
  return `
    <div class="field-line ${className}">
      <span class="field-label">${htmlEscape(label)}</span>
      <span class="field-value">${value ? htmlEscape(value) : "&nbsp;"}</span>
    </div>`;
}

function buildSignatureHTML(signature?: string): string {
  if (signature) {
    return `<img src="${signature}" alt="Signature" class="sig-image" />`;
  }
  return `<div class="sig-label">Signature</div>`;
}

/** Construit le HTML complet du reçu de paiement (aperçu iframe ou fenêtre d'impression). */
export function buildRecuPaiementHTML(data: RecuPaiementModuleData, brand: SocieteBrand): string {
  const logoUrl = resolveLogoUrl(brand.logoUrl);
  const logoImg = logoUrl
    ? `<img src="${logoUrl}" alt="${htmlEscape(brand.nom)}" class="brand-logo" onerror="this.style.display='none'">`
    : "";
  const showName = brand.afficherNomAvecLogo !== false;
  const sommeLettres = htmlEscape(montantEnLettresFCFA(data.somme));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Reçu de paiement</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  background: #eef2f7;
  color: ${RECEIPT_BLUE};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.receipt-paper {
  width: ${RECEIPT_WIDTH_MM}mm;
  height: ${RECEIPT_HEIGHT_MM}mm;
  margin: 0 auto;
  background: ${RECEIPT_PAPER};
  padding: 8mm 10mm;
  color: ${RECEIPT_BLUE};
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(30, 74, 138, 0.2);
}
.brand-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  flex-shrink: 0;
}
.header-text { flex: 1; min-width: 0; }
.brand-name {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.25;
  margin-bottom: 2px;
}
.header-legal-line {
  font-size: 8.5px;
  line-height: 1.45;
}
.doc-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 6px;
}
.body {
  font-size: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field-row--split {
  display: flex;
  gap: 16px;
}
.field-line {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.field-label {
  flex-shrink: 0;
  font-weight: 600;
  white-space: nowrap;
  font-size: 10px;
}
.field-value {
  flex: 1;
  border-bottom: 1px solid ${RECEIPT_BLUE};
  min-height: 14px;
  padding-bottom: 1px;
  font-weight: 500;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.somme-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.somme-label {
  flex-shrink: 0;
  font-weight: 600;
  font-size: 10px;
}
.somme-value {
  flex: 1;
  border-bottom: 1px solid ${RECEIPT_BLUE};
  min-height: 14px;
  padding-bottom: 1px;
  font-size: 10px;
}
.field-row--single .field-line { flex: none; width: 100%; }
.field-row--single .field-value { white-space: normal; }
.field-row--footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 4px;
}
.field-row--footer .field-line { max-width: 55%; flex: none; }
.sig-box {
  width: 38mm;
  height: 18mm;
  border: 1.5px solid ${RECEIPT_BLUE};
  border-radius: 8px;
  padding: 4px 6px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sig-label {
  font-size: 9px;
  font-weight: 700;
}
.sig-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.no-print {
  text-align: center;
  padding: 12px;
  background: #f3f5f7;
  border-bottom: 1px solid #d2dbe9;
}
.btn-print {
  background: ${RECEIPT_BLUE};
  color: #fff;
  border: none;
  padding: 9px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
@media print {
  @page { size: ${RECEIPT_WIDTH_MM}mm ${RECEIPT_HEIGHT_MM}mm landscape; margin: 0; }
  .no-print { display: none !important; }
  body { background: ${RECEIPT_PAPER}; }
  .receipt-paper { width: ${RECEIPT_WIDTH_MM}mm; height: ${RECEIPT_HEIGHT_MM}mm; margin: 0; }
}
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
</div>
<div class="receipt-paper">
  <div class="header">
    ${logoImg}
    <div class="header-text">
      ${showName ? `<div class="brand-name">${htmlEscape(brand.nom)}</div>` : ""}
      ${buildHeaderLegalHTML(brand)}
      <div class="doc-title">Reçu de paiement</div>
    </div>
  </div>
  <div class="body">
    <div class="field-row--split">
      ${buildFieldLine("Nom :", data.nom)}
      ${buildFieldLine("Prénom :", data.prenom)}
    </div>
    <div class="somme-row">
      <span class="somme-label">la somme de :</span>
      <span class="somme-value">${sommeLettres || "&nbsp;"}</span>
    </div>
    <div class="field-row--single">
      ${buildFieldLine("Motif :", data.motif)}
    </div>
    <div class="field-row--split">
      ${buildFieldLine("Montant payé :", fmtFCFA(data.montantPaye))}
      ${buildFieldLine("Reste :", fmtFCFA(data.reste))}
    </div>
    <div class="field-row--footer">
      ${buildFieldLine("Date, le", fmtDate(data.date))}
      <div class="sig-box">
        ${buildSignatureHTML(data.signature)}
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function printRecuPaiementModule(data: RecuPaiementModuleData, societe?: SocieteBrand | null): boolean {
  if (!requireSocieteBrand(societe, "ce reçu")) return false;
  const html = buildRecuPaiementHTML(data, societe);
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
