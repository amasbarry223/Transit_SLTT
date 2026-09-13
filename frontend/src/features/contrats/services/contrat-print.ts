"use client";

import { BRAND } from "@/lib/brand-colors";
import { ensureSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "@/lib/export/html-escape";
import {
  OFFICIAL_LETTERHEAD_CSS,
  buildOfficialLetterheadHTML,
  documentFooterHTML,
  acquirePrintTarget,
  triggerPrint,
  warnPopupBlocked,
} from "@/lib/export/print-document";
import { fmtFCFA, fmtDate } from "@/lib/export/print-modules/shared";
import {
  SIGNATORIES_BLOCK_CSS,
  buildSignatoriesBlockHTML,
} from "@/lib/export/print-modules/signatories-block";

/* ------------------------------------------------------------------ */
/* printContrat — Document contrat d'entreposage avec en-tête officiel  */
/* SLTT. Même identité visuelle que printDevis (papier à en-tête,       */
/* bandeau "parties", tableaux de lignes, total, signatures) — pas de   */
/* statut coloré (cohérent avec la suppression des badges/chips sur     */
/* les autres PDF de cette session).                                   */
/* ------------------------------------------------------------------ */

export interface ContratPrestationPrintRow {
  libelle: string;
  description?: string;
  montant?: number;
  statut: string;
}

export interface ContratDepensePrintRow {
  libelle: string;
  montant: number;
  dateDepense: string;
  modePaiement: string;
}

export interface ContratPrintData {
  reference: string;
  clientNom: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  objet: string;
  dateDebut: string;
  dateFin?: string;
  montant: number;
  statut: string;
  notes?: string;
  prestations: ContratPrestationPrintRow[];
  depenses: ContratDepensePrintRow[];
  totalDepenses: number;
}

function prestataireDisplayName(societe: SocieteBrand): string {
  return societe.raisonSociale || societe.nom;
}

const PIN_ICON = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;

const PHONE_ICON = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

const MAIL_ICON = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;

const BUILDING_ICON = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;

function formatSinglePhone(phone: string): string {
  if (!phone) return "";
  if (phone.includes(" ")) return phone;

  // Mali (+223 suivi de 8 chiffres : +223 77 77 85 46)
  const maliMatch = phone.match(/^(\+223)(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (maliMatch) {
    return `${maliMatch[1]} ${maliMatch[2]} ${maliMatch[3]} ${maliMatch[4]} ${maliMatch[5]}`;
  }

  // Côte d'Ivoire (+225 suivi de 10 chiffres : +225 01 02 03 04 05)
  const ciMatch10 = phone.match(/^(\+225)(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (ciMatch10) {
    return `${ciMatch10[1]} ${ciMatch10[2]} ${ciMatch10[3]} ${ciMatch10[4]} ${ciMatch10[5]} ${ciMatch10[6]}`;
  }

  // Côte d'Ivoire ancien format (+225 suivi de 8 chiffres)
  const ciMatch8 = phone.match(/^(\+225)(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (ciMatch8) {
    return `${ciMatch8[1]} ${ciMatch8[2]} ${ciMatch8[3]} ${ciMatch8[4]} ${ciMatch8[5]}`;
  }

  // Format international générique (+XXX suivi de 6+ chiffres)
  const intlMatch = phone.match(/^(\+\d{1,3})(\d{6,})$/);
  if (intlMatch) {
    const code = intlMatch[1];
    const rest = intlMatch[2];
    const parts = rest.match(/.{1,2}/g);
    if (parts) {
      return `${code} ${parts.join(" ")}`;
    }
  }

  // Numéro local 8 chiffres (Mali)
  if (/^\d{8}$/.test(phone)) {
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  }

  // Numéro local 10 chiffres (CI)
  if (/^\d{10}$/.test(phone)) {
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  }

  return phone;
}

export function formatPhoneNumber(raw?: string): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  if (!cleaned) return "";

  if (cleaned.includes("/")) {
    return cleaned
      .split("/")
      .map((part) => formatSinglePhone(part.trim()))
      .join(" / ");
  }

  return formatSinglePhone(cleaned);
}

export function buildContratPrintHTML(data: ContratPrintData, societe?: SocieteBrand | null): string {
  const resolvedBrand = ensureSocieteBrand(societe);
  const letterheadHTML = buildOfficialLetterheadHTML(resolvedBrand);
  const prestataireNom = prestataireDisplayName(resolvedBrand);

  const prestataireAdresse = resolvedBrand.legal?.adresse;
  const prestataireTel = resolvedBrand.legal?.telephone;
  const prestataireRccm = resolvedBrand.legal?.rccm;
  const prestataireNif = resolvedBrand.legal?.nif;

  const prestataireContacts: string[] = [];
  if (prestataireAdresse) {
    prestataireContacts.push(`
      <div class="party-contact-row">
        <span class="contact-icon" title="Adresse">${PIN_ICON}</span>
        <span class="contact-val">${htmlEscape(prestataireAdresse)}</span>
      </div>`);
  }
  if (prestataireTel) {
    prestataireContacts.push(`
      <div class="party-contact-row">
        <span class="contact-icon" title="Téléphone">${PHONE_ICON}</span>
        <span class="contact-val contact-val--strong">${htmlEscape(formatPhoneNumber(prestataireTel))}</span>
      </div>`);
  }
  if (prestataireRccm || prestataireNif) {
    const legalParts = [
      prestataireRccm ? `RCCM : ${prestataireRccm}` : "",
      prestataireNif ? `NIF : ${prestataireNif}` : "",
    ].filter(Boolean).join(" · ");
    prestataireContacts.push(`
      <div class="party-contact-row">
        <span class="contact-icon" title="Registre">${BUILDING_ICON}</span>
        <span class="contact-val contact-val--legal">${htmlEscape(legalParts)}</span>
      </div>`);
  }

  const formattedClientPhone = formatPhoneNumber(data.clientTelephone);

  const clientContacts: string[] = [];
  if (data.clientAdresse) {
    clientContacts.push(`
      <div class="party-contact-row">
        <span class="contact-icon" title="Adresse">${PIN_ICON}</span>
        <span class="contact-val">${htmlEscape(data.clientAdresse)}</span>
      </div>`);
  }
  if (formattedClientPhone) {
    clientContacts.push(`
      <div class="party-contact-row">
        <span class="contact-icon" title="Téléphone">${PHONE_ICON}</span>
        <span class="contact-val contact-val--strong">${htmlEscape(formattedClientPhone)}</span>
      </div>`);
  }
  if (data.clientEmail) {
    clientContacts.push(`
      <div class="party-contact-row">
        <span class="contact-icon" title="Email">${MAIL_ICON}</span>
        <span class="contact-val contact-val--email">${htmlEscape(data.clientEmail)}</span>
      </div>`);
  }

  const dureeLabel = data.dateFin
    ? `${fmtDate(data.dateDebut)} → ${fmtDate(data.dateFin)}`
    : `${fmtDate(data.dateDebut)} → durée indéterminée`;

  const prestationsRowsHTML = data.prestations.length
    ? data.prestations
        .map(
          (p) => `
    <tr>
      <td class="t-desc">${htmlEscape(p.libelle)}${p.description ? `<br><span class="t-sub">${htmlEscape(p.description)}</span>` : ""}</td>
      <td class="t-statut">${htmlEscape(p.statut)}</td>
      <td class="t-amount">${p.montant ? fmtFCFA(p.montant) : '<span class="empty">—</span>'}</td>
    </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="t-empty">Aucune prestation optionnelle</td></tr>`;

  const depensesRowsHTML = data.depenses.length
    ? data.depenses
        .map(
          (d) => `
    <tr>
      <td class="t-desc">${htmlEscape(d.libelle)}</td>
      <td class="t-mode">${htmlEscape(d.modePaiement)}</td>
      <td class="t-date">${fmtDate(d.dateDepense)}</td>
      <td class="t-amount">${fmtFCFA(d.montant)}</td>
    </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="t-empty">Aucune dépense enregistrée</td></tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Contrat ${htmlEscape(data.reference)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #fff;
  color: #263041;
  font-size: 11px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap { max-width: 100%; margin: 0 auto; background: #fff; }

${OFFICIAL_LETTERHEAD_CSS}

/* ── Corps du document ─────────────────────────────────────────── */
.doc { padding: 22px 28px 0; }

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
.field-k {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #99a2b2;
  margin-bottom: 4px;
}

/* ── Section des parties (Prestataire & Client) ─────────────────── */
.parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 14px 0 16px;
  border-bottom: 1px solid #e2e6ee;
}
.party-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
}
.party-card--prestataire {
  border-left: 3.5px solid #ED1C24;
}
.party-card--client {
  border-left: 3.5px solid ${BRAND.navy};
  background: #fbfcfe;
}
.party-role {
  font-size: 8.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 4px;
  display: inline-flex;
  align-items: center;
}
.party-role--prestataire {
  color: #ED1C24;
}
.party-role--client {
  color: ${BRAND.navy};
}
.party-name {
  font-size: 13px;
  font-weight: 700;
  color: ${BRAND.navy};
  line-height: 1.25;
  margin-bottom: 6px;
}
.party-contacts {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed #e2e8f0;
}
.party-contact-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: #475569;
  line-height: 1.35;
}
.contact-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 4px;
  background: #eef2f6;
  color: ${BRAND.navy};
  flex-shrink: 0;
}
.contact-val {
  color: #334155;
  word-break: break-word;
}
.contact-val--strong {
  font-weight: 600;
  letter-spacing: 0.02em;
}
.contact-val--email {
  color: #1d4ed8;
  font-weight: 500;
}
.contact-val--legal {
  font-size: 9.5px;
  color: #64748b;
}

/* Objet + durée + statut : ligne de définition */
.meta-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e2e6ee; }
.meta-cell { flex: 1; padding-right: 20px; }
.meta-cell:last-child { padding-right: 0; text-align: right; }
.meta-val { font-size: 12px; font-weight: 600; color: #263041; }

.objet-line { padding: 12px 0; border-bottom: 1px solid #e2e6ee; }
.objet-line .meta-val { font-weight: 500; white-space: pre-wrap; }

/* Tableaux (prestations, dépenses) */
.lines { padding-top: 18px; }
.lines-cap {
  font-size: 9px;
  color: #99a2b2;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 7px;
}
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.tbl-prestations colgroup .c-desc { width: 56%; }
.tbl-prestations colgroup .c-statut { width: 20%; }
.tbl-prestations colgroup .c-amount { width: 24%; }
.tbl-depenses colgroup .c-desc { width: 40%; }
.tbl-depenses colgroup .c-mode { width: 20%; }
.tbl-depenses colgroup .c-date { width: 18%; }
.tbl-depenses colgroup .c-amount { width: 22%; }
thead th {
  background: ${BRAND.navy};
  color: #fff;
  padding: 8px 12px;
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  text-align: left;
}
thead th.t-amount { text-align: right; }
tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #e8ebf1;
  font-size: 11px;
}
tbody tr:last-child td { border-bottom: 1px solid #cfd6e2; }
.t-desc { color: #263041; }
.t-sub { color: #99a2b2; font-size: 9.5px; }
.t-statut, .t-mode, .t-date { color: #55617a; font-size: 10px; }
.t-amount {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #263041;
  white-space: normal;
  word-break: keep-all;
}
.t-empty { text-align: center; color: #99a2b2; font-style: italic; }
.empty { color: #cdd4df; }

.settle { display: flex; justify-content: flex-end; gap: 10px; padding-top: 12px; flex-direction: column; align-items: flex-end; }
.total-box {
  width: 340px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 11px 14px;
}
.total-box.total-box--main { background: ${BRAND.navy}; color: #fff; }
.total-box.total-box--main .amt { color: #fde68a; }
.total-box.total-box--sub { background: #f3f5f9; color: ${BRAND.navy}; border: 1px solid #e2e6ee; }
.total-box.total-box--sub .amt { color: ${BRAND.navy}; }
.total-box .lbl { font-size: 12px; font-weight: 700; }
.total-box .amt { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

.note-line {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e6ee;
  font-size: 10.5px;
  color: #55617a;
}
.note-line .field-k { margin-bottom: 4px; }
.note-line p { white-space: pre-wrap; margin-top: 2px; }

${SIGNATORIES_BLOCK_CSS}
.signatories { margin-top: 32px; }

.footer {
  margin-top: 22px;
  padding: 12px 28px 16px;
  border-top: 1px solid #e2e6ee;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 20px;
  color: #99a2b2;
}
.footer-note { font-size: 8.5px; line-height: 1.5; }
.footer-brand { font-size: 9px; font-weight: 700; color: ${BRAND.navy}; white-space: nowrap; }
.no-print { text-align: center; padding: 14px; background: #f3f5f7; border-bottom: 1px solid #d2dbe9; }
.btn-print { background: ${BRAND.navy}; color: #fff; border: none; padding: 10px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }

@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  .no-print { display: none !important; }
  body { background: white; font-size: 10px; }
  .party-card {
    background: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .party-card--prestataire {
    border-left: 3.5px solid #ED1C24 !important;
  }
  .party-card--client {
    border-left: 3.5px solid ${BRAND.navy} !important;
  }
  .contact-icon {
    background: #eef2f6 !important;
    color: ${BRAND.navy} !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .contact-val--email {
    color: #1d4ed8 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
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
        <div class="doc-kind">Contrat</div>
        <div class="doc-no">${htmlEscape(data.reference)}</div>
      </div>
    </header>

    <section class="parties">
      <div class="party-card party-card--prestataire">
        <div class="party-role party-role--prestataire">Prestataire de services</div>
        <div class="party-name">${htmlEscape(prestataireNom)}</div>
        ${prestataireContacts.length ? `<div class="party-contacts">${prestataireContacts.join("")}</div>` : ""}
      </div>
      <div class="party-card party-card--client">
        <div class="party-role party-role--client">Client contractant</div>
        <div class="party-name">${htmlEscape(data.clientNom)}</div>
        ${clientContacts.length ? `<div class="party-contacts">${clientContacts.join("")}</div>` : ""}
      </div>
    </section>

    <div class="objet-line">
      <div class="field-k">Objet du contrat</div>
      <div class="meta-val">${htmlEscape(data.objet)}</div>
    </div>

    <section class="meta-row">
      <div class="meta-cell">
        <div class="field-k">Durée du contrat</div>
        <div class="meta-val">${dureeLabel}</div>
      </div>
      <div class="meta-cell">
        <div class="field-k">Statut</div>
        <div class="meta-val">${htmlEscape(data.statut)}</div>
      </div>
    </section>

    <section class="lines">
      <div class="lines-cap">Prestations optionnelles</div>
      <table class="tbl-prestations">
        <colgroup><col class="c-desc"><col class="c-statut"><col class="c-amount"></colgroup>
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Statut</th>
            <th class="t-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${prestationsRowsHTML}</tbody>
      </table>
    </section>

    <section class="lines">
      <div class="lines-cap">Dépenses engagées</div>
      <table class="tbl-depenses">
        <colgroup><col class="c-desc"><col class="c-mode"><col class="c-date"><col class="c-amount"></colgroup>
        <thead>
          <tr>
            <th>Libellé</th>
            <th>Mode de paiement</th>
            <th>Date</th>
            <th class="t-amount">Montant</th>
          </tr>
        </thead>
        <tbody>${depensesRowsHTML}</tbody>
      </table>
    </section>

    <section class="settle">
      ${data.totalDepenses > 0 ? `
      <div class="total-box total-box--sub">
        <span class="lbl">Total dépenses engagées</span>
        <span class="amt">${fmtFCFA(data.totalDepenses)}</span>
      </div>` : ""}
      <div class="total-box total-box--main">
        <span class="lbl">Montant du contrat</span>
        <span class="amt">${fmtFCFA(data.montant)}</span>
      </div>
    </section>

    ${data.notes ? `<div class="note-line"><div class="field-k">Notes</div><p>${htmlEscape(data.notes)}</p></div>` : ""}

    ${buildSignatoriesBlockHTML()}
  </main>

  <footer class="footer">
    <div class="footer-note">Document contractuel · usage interne et archivage</div>
    <div class="footer-brand">${documentFooterHTML(resolvedBrand.nom)}</div>
  </footer>

</div>
</body>
</html>`;
}

export function printContrat(data: ContratPrintData, societe?: SocieteBrand | null): void {
  const win = acquirePrintTarget();
  if (!win) {
    warnPopupBlocked();
    return;
  }

  const html = buildContratPrintHTML(data, societe);
  win.document.open();
  win.document.write(html);
  win.document.close();
  triggerPrint(win);
}
