"use client";

import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import {
  buildReceiptPrintCSS,
  RECEIPT_LOGO_FALLBACK,
  RECEIPT_PRINT_FRAME_ID,
  RECEIPT_WIDTH_MM,
  RECEIPT_HEIGHT_MM,
} from "@/lib/recus-paiement-styles";
import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import { acquirePrintTarget, resolveLogoUrl, triggerPrint, warnPopupBlocked } from "../print-document";
import { fmtDate, fmtFCFA } from "./shared";

/* ------------------------------------------------------------------ */
/* Reçu de paiement — format exact 19,5×8,2 cm paysage (195×82 mm) */
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

export interface BuildRecuPaiementHTMLOptions {
  /** Barre « Imprimer » pour aperçu manuel dans un nouvel onglet. */
  includePrintToolbar?: boolean;
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

function buildReceiptContentHTML(data: RecuPaiementModuleData, brand: SocieteBrand): string {
  const logoUrl = resolveLogoUrl(brand.logoUrl) ?? RECEIPT_LOGO_FALLBACK;
  const logoImg = `<img src="${logoUrl}" alt="${htmlEscape(brand.nom)}" class="brand-logo" onerror="this.onerror=null;this.src='${RECEIPT_LOGO_FALLBACK}'">`;
  const showName = brand.afficherNomAvecLogo !== false;
  const sommeLettres = htmlEscape(montantEnLettresFCFA(data.somme));

  return `<div class="receipt-paper">
  <div class="header">
    <div class="header-logo">${logoImg}</div>
    <div class="header-text">
      ${showName ? `<div class="brand-name">${htmlEscape(brand.nom)}</div>` : ""}
      ${buildHeaderLegalHTML(brand)}
      <div class="doc-title">Reçu de paiement</div>
    </div>
    <div class="header-spacer"></div>
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
</div>`;
}

/** Construit le HTML complet du reçu (aperçu ou impression). */
export function buildRecuPaiementHTML(
  data: RecuPaiementModuleData,
  brand: SocieteBrand,
  options?: BuildRecuPaiementHTMLOptions,
): string {
  const includePrintToolbar = options?.includePrintToolbar ?? false;
  const toolbar = includePrintToolbar
    ? `<div class="no-print">
  <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Reçu de paiement</title>
<style>${buildReceiptPrintCSS({ includeScreenToolbar: includePrintToolbar })}</style>
</head>
<body>
${toolbar}${buildReceiptContentHTML(data, brand)}
</body>
</html>`;
}

/** HTML minimal pour impression — uniquement le reçu, format verrouillé 19,5×8,2 cm. */
export function buildRecuPaiementPrintHTML(data: RecuPaiementModuleData, brand: SocieteBrand): string {
  return buildRecuPaiementHTML(data, brand, { includePrintToolbar: false });
}

export function printRecuPaiementModule(data: RecuPaiementModuleData, societe?: SocieteBrand | null): boolean {
  if (!requireSocieteBrand(societe, "ce reçu")) return false;

  const html = buildRecuPaiementPrintHTML(data, societe);
  const win = acquirePrintTarget({
    widthMm: RECEIPT_WIDTH_MM,
    heightMm: RECEIPT_HEIGHT_MM,
    frameId: RECEIPT_PRINT_FRAME_ID,
  });
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
