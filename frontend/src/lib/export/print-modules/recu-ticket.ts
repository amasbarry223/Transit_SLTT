"use client";

import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import { RECEIPT_LOGO_FALLBACK } from "@/lib/recus-paiement-styles";
import { ensureSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import { acquirePrintTarget, resolveLogoUrl, triggerPrint, warnPopupBlocked } from "../print-document";
import { fmtFCFA } from "./shared";
import type { RecuPaiementModuleData } from "./recu-paiement";

/* ------------------------------------------------------------------ */
/* Reçu de paiement — TICKET DE CAISSE 80 mm (imprimante thermique     */
/* installée dans Windows, impression via la boîte de dialogue du      */
/* navigateur). Noir uniquement : une thermique n'imprime ni couleur   */
/* ni aplat gris fiable. Zone imprimable réelle ≈ 72 mm sur 80 mm.     */
/* ------------------------------------------------------------------ */

export const TICKET_WIDTH_MM = 80;
const TICKET_CONTENT_MM = 72;
/** Hauteur provisoire de l'iframe avant mesure du contenu réel. */
const TICKET_DRAFT_HEIGHT_MM = 400;
const TICKET_FRAME_ID = "sltt-print-frame-ticket";
const PX_PER_MM = 96 / 25.4;
/** Marge de papier sous la dernière ligne, pour que la coupe ne la rogne pas. */
const TICKET_TAIL_MM = 8;

export interface RecuTicketData extends RecuPaiementModuleData {
  /** Statut métier (SOLDE / PARTIEL / EN_ATTENTE). */
  statut?: string;
  /** Agent qui a encaissé (nom de l'utilisateur connecté). */
  encaissePar?: string;
}

const STATUT_LABEL: Record<string, string> = {
  SOLDE: "SOLDÉ",
  PARTIEL: "PAIEMENT PARTIEL",
  EN_ATTENTE: "EN ATTENTE",
};

function row(label: string, value: string, strong = false): string {
  return `<div class="row${strong ? " strong" : ""}"><span>${htmlEscape(label)}</span><span>${htmlEscape(value)}</span></div>`;
}

export function buildTicketHTML(data: RecuTicketData, brand: SocieteBrand): string {
  const logoUrl = resolveLogoUrl(brand.logoUrl) ?? RECEIPT_LOGO_FALLBACK;
  const showName = brand.afficherNomAvecLogo !== false;
  const date = data.date ? new Date(data.date) : new Date();
  const dateStr = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const heureStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const client = [data.prenom, data.nom].filter(Boolean).join(" ");
  const legal = [
    brand.legal?.adresse,
    brand.legal?.telephone ? `Tél. ${brand.legal.telephone}` : undefined,
    brand.legal?.rccm ? `RCCM ${brand.legal.rccm}` : undefined,
    brand.legal?.nif ? `NIF ${brand.legal.nif}` : undefined,
  ].filter(Boolean) as string[];
  const statut = data.statut ? STATUT_LABEL[data.statut] ?? data.statut : undefined;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Ticket ${htmlEscape(data.reference)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${TICKET_WIDTH_MM}mm; background: #fff; }
body {
  padding: 3mm ${(TICKET_WIDTH_MM - TICKET_CONTENT_MM) / 2}mm 0;
  color: #000;
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
  font-size: 11.5px;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.center { text-align: center; }
.logo { display: block; margin: 0 auto 1.5mm; max-width: 26mm; max-height: 18mm; object-fit: contain; filter: grayscale(1) contrast(1.4); }
.brand { font-size: 15px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; }
.legal { font-size: 9.5px; line-height: 1.3; }
.sep { border-top: 1px dashed #000; margin: 2.2mm 0; }
.sep.solid { border-top: 1.5px solid #000; }
.title { font-size: 13px; font-weight: 800; letter-spacing: 0.12em; }
.ref { font-size: 15px; font-weight: 800; letter-spacing: 0.04em; margin-top: 0.5mm; }
.meta { font-size: 10.5px; }
.row { display: flex; justify-content: space-between; gap: 3mm; padding: 0.4mm 0; }
.row span:first-child { flex-shrink: 0; }
.row span:last-child { text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.row.strong { font-size: 14px; font-weight: 800; padding: 1mm 0; }
.row.strong span:last-child { font-weight: 800; }
.block-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; }
.block-value { font-weight: 700; overflow-wrap: anywhere; }
.lettres { font-size: 10.5px; font-style: italic; overflow-wrap: anywhere; }
.statut { display: inline-block; border: 1.5px solid #000; padding: 0.6mm 2.5mm; font-weight: 800; letter-spacing: 0.08em; font-size: 11px; }
.sign { margin-top: 7mm; border-top: 1px solid #000; padding-top: 1mm; font-size: 9.5px; text-align: center; }
.thanks { font-size: 10.5px; font-weight: 600; }
@media print {
  @page { margin: 0; }
}
</style>
</head>
<body>
  <div class="center">
    <img class="logo" src="${htmlEscape(logoUrl)}" alt="" onerror="this.style.display='none'">
    ${showName ? `<div class="brand">${htmlEscape(brand.nom)}</div>` : ""}
    ${legal.map((l) => `<div class="legal">${htmlEscape(l)}</div>`).join("")}
  </div>

  <div class="sep solid"></div>
  <div class="center">
    <div class="title">REÇU DE PAIEMENT</div>
    <div class="ref">N° ${htmlEscape(data.reference)}</div>
    <div class="meta">${dateStr} à ${heureStr}</div>
  </div>
  <div class="sep"></div>

  <div class="block-label">Client</div>
  <div class="block-value">${htmlEscape(client || "—")}</div>
  ${data.motif ? `<div class="block-label" style="margin-top:1.5mm">Motif</div><div class="block-value">${htmlEscape(data.motif)}</div>` : ""}

  <div class="sep"></div>
  ${data.somme ? row("Somme due", fmtFCFA(data.somme)) : ""}
  ${row("MONTANT PAYÉ", fmtFCFA(data.montantPaye ?? 0), true)}
  ${data.somme ? row("Reste à payer", fmtFCFA(data.reste ?? 0)) : ""}
  ${data.montantPaye ? `<div class="lettres">Soit : ${htmlEscape(montantEnLettresFCFA(data.montantPaye))}</div>` : ""}
  ${statut ? `<div class="center" style="margin-top:2mm"><span class="statut">${htmlEscape(statut)}</span></div>` : ""}

  <div class="sep"></div>
  ${data.encaissePar ? row("Encaissé par", data.encaissePar) : ""}
  <div class="sign">Signature et cachet</div>

  <div class="sep"></div>
  <div class="center thanks">Merci de votre confiance</div>
  <div class="center legal">Conservez ce ticket comme justificatif de paiement.</div>
</body>
</html>`;
}

/** Attend logo et polices (bornées à 3 s) : la hauteur mesurée doit être la
 *  hauteur finale, sinon la coupe tomberait au milieu du ticket. */
async function waitForAssets(doc: Document): Promise<void> {
  const images = Array.from(doc.images).filter((img) => !img.complete);
  const imagesReady = Promise.all(
    images.map((img) => new Promise<void>((resolve) => {
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    })),
  );
  const fontsReady = doc.fonts?.ready ?? Promise.resolve();
  await Promise.race([Promise.all([imagesReady, fontsReady]), new Promise((r) => setTimeout(r, 3000))]);
}

/**
 * Imprime un reçu au format ticket de caisse 80 mm. Sur un rouleau, une page
 * A4 ferait dérouler ~30 cm de papier blanc : on mesure la hauteur réelle du
 * ticket rendu et on fixe `@page { size: 80mm <hauteur>mm }` pour que le
 * pilote coupe juste après le contenu.
 */
export async function printRecuPaiementTicket(data: RecuTicketData, societe?: SocieteBrand | null): Promise<boolean> {
  const brand = ensureSocieteBrand(societe);
  const win = acquirePrintTarget({ widthMm: TICKET_WIDTH_MM, heightMm: TICKET_DRAFT_HEIGHT_MM, frameId: TICKET_FRAME_ID });
  if (!win) {
    warnPopupBlocked();
    return false;
  }

  win.document.open();
  win.document.write(buildTicketHTML(data, brand));
  win.document.close();

  await waitForAssets(win.document);
  const heightMm = Math.ceil(win.document.body.scrollHeight / PX_PER_MM) + TICKET_TAIL_MM;
  const pageStyle = win.document.createElement("style");
  pageStyle.textContent = `@page { size: ${TICKET_WIDTH_MM}mm ${heightMm}mm; margin: 0; }`;
  win.document.head.appendChild(pageStyle);

  triggerPrint(win);
  return true;
}
