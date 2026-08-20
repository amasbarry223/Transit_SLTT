"use client";

import {
  PRINT_FALLBACK_MS,
  PRINT_IMAGE_READY_MS,
  PRINT_WINDOW_READY_MS,
} from "@/lib/constants";
import {
  requireSocieteBrand,
  type SocieteBrand,
  type SocieteLegalInfo,
} from "@/lib/societe-brand";
import { toast } from "@/hooks/use-toast";
import { toastLoading } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { splitTextIntoLines } from "@/lib/recus-paiement-styles";
import { htmlEscape } from "./html-escape";
import { OFFICIAL_LETTERHEAD_CSS, PRINT_HTML_DOCUMENT_CSS } from "./print-styles";

/** Résout un chemin de logo en URL absolue pour la fenêtre d'impression. */
export function resolveLogoUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (typeof window === "undefined" || /^https?:\/\//.test(path)) return path;
  return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function brandLogoImgHTML(
  brand: SocieteBrand,
  className = "brand-logo",
  cacheBust?: string,
): string {
  let url = resolveLogoUrl(brand.logoUrl);
  if (!url) return "";
  if (cacheBust) url += `${url.includes("?") ? "&" : "?"}${cacheBust}`;
  return `<img src="${htmlEscape(url)}" alt="${htmlEscape(brand.nom)}" class="${className}" style="background:transparent" onerror="this.style.display='none'">`;
}

export function documentFooterHTML(brandName: string): string {
  return `${htmlEscape(brandName)} · © ${new Date().getFullYear()}`;
}

export function platformFooterHTML(brandName: string): string {
  return `Document généré · ${htmlEscape(brandName)} · © ${new Date().getFullYear()}`;
}

/**
 * Construit la ligne légale (adresse · tél · RCCM · NIF) d'une société pour le
 * pied de page d'un document imprimé — n'affiche que les champs renseignés,
 * sur une seule ligne.
 */
export function buildLegalLine(info?: SocieteLegalInfo): string {
  if (!info) return "";
  return [
    info.adresse ? htmlEscape(info.adresse) : "",
    info.telephone ? `Tél. : ${htmlEscape(info.telephone)}` : "",
    info.rccm ? `RCCM : ${htmlEscape(info.rccm)}` : "",
    info.nif ? `NIF : ${htmlEscape(info.nif)}` : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");
}

/**
 * Bloc légal sous le logo (adresse/tél/RCCM/NIF). Le nom est rendu séparément
 * via `.brand-name` — ce bloc ne contient que la ligne légale pour éviter
 * la duplication « nom + nom + NIF » sur devis, contrats, etc.
 */
/** Découpe la raison sociale sur le papier à en-tête officiel (2 ou 3 lignes). */
export function splitRaisonSocialeLines(raisonSociale: string): string[] {
  const trimmed = raisonSociale.trim();
  if (!trimmed) return [];

  if (trimmed.includes("\n")) {
    return trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
  }

  const threeLineMatch = trimmed.match(/^(.+?\s+de)\s+(logistique)\s+(transit[-\s]transport)$/i);
  if (threeLineMatch) {
    return [threeLineMatch[1].trim(), threeLineMatch[2].trim(), threeLineMatch[3].trim()];
  }

  const match = trimmed.match(/^(.+?)\s+(transit[-\s]transport)$/i);
  if (match) return [match[1].trim(), match[2].trim()];

  const [l1, l2] = splitTextIntoLines(trimmed, 2);
  return l2 ? [l1, l2] : [l1];
}

/** HTML + CSS de l'en-tête officiel (logo + raison sociale + coordonnées légales). */
export function buildOfficialLetterheadHTML(
  brand: SocieteBrand,
  options?: { logoClass?: string },
): string {
  const logoClass = options?.logoClass ?? "official-letterhead-logo";
  const logoImg = brandLogoImgHTML(brand, logoClass, "v=transparent2");
  const displayName = brand.raisonSociale || brand.nom;
  const showName = brand.afficherNomAvecLogo !== false;
  const nameLines = showName ? splitRaisonSocialeLines(displayName) : [];
  const nameHTML = nameLines
    .map((line) => `<div class="official-letterhead-name-line">${htmlEscape(line.toUpperCase())}</div>`)
    .join("\n");
  const l = brand.legal;

  const legalHTML = [
    l?.adresse
      ? `<div class="official-letterhead-line">${htmlEscape(l.adresse)}</div>`
      : "",
    l?.telephone
      ? `<div class="official-letterhead-line">Tél. : ${htmlEscape(l.telephone)}</div>`
      : "",
    l?.rccm
      ? `<div class="official-letterhead-line official-letterhead-legal">RCCM : ${htmlEscape(l.rccm)}</div>`
      : "",
    l?.nif
      ? `<div class="official-letterhead-line official-letterhead-legal">NIF : ${htmlEscape(l.nif)}</div>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<header class="official-letterhead">
    <div class="official-letterhead-row">
      <div class="official-letterhead-brand">
        <div class="official-letterhead-logo-wrap">${logoImg}</div>
        ${nameHTML ? `<div class="official-letterhead-name">${nameHTML}</div>` : ""}
      </div>
      ${legalHTML ? `<div class="official-letterhead-legal-block">${legalHTML}</div>` : ""}
    </div>
    <div class="official-letterhead-rule"></div>
  </header>`;
}

export { OFFICIAL_LETTERHEAD_CSS };

export function buildBrandSubHTML(brand: SocieteBrand): string {
  const legalLine = buildLegalLine(brand.legal);
  if (legalLine) return legalLine;
  if (brand.afficherNomAvecLogo === false) return "";
  return htmlEscape(brand.nom);
}

/**
 * Impression via iframe cachée (pas de popup → pas de bloqueur navigateur).
 * Remplace window.open pour tous les modules d'impression SLTT.
 */
const PRINT_FRAME_ID = "sltt-print-frame";

/** Dimensions par défaut — A4 portrait (documents standards). */
const DEFAULT_PRINT_WIDTH_MM = 210;
const DEFAULT_PRINT_HEIGHT_MM = 297;

export interface PrintTargetOptions {
  /** Largeur iframe / page (mm). Défaut : A4 portrait. */
  widthMm?: number;
  /** Hauteur iframe / page (mm). Défaut : A4 portrait. */
  heightMm?: number;
  /** ID iframe dédié (ex. reçu carnet ≠ A4). */
  frameId?: string;
}

export function acquirePrintTarget(options?: PrintTargetOptions): Window | null {
  if (typeof document === "undefined") return null;

  const widthMm = options?.widthMm ?? DEFAULT_PRINT_WIDTH_MM;
  const heightMm = options?.heightMm ?? DEFAULT_PRINT_HEIGHT_MM;
  const frameId = options?.frameId ?? PRINT_FRAME_ID;

  let iframe = document.getElementById(frameId) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = frameId;
    iframe.name = frameId;
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("title", "Impression SLTT");
    iframe.setAttribute("tabindex", "-1");
    // Dimensions réelles requises : une iframe 0×0 fait caler indéfiniment
    // la génération d'aperçu du dialogue d'impression système (Chromium).
    // Pour le reçu carnet (19,5×8,2 cm), passer widthMm/heightMm dédiés.
    Object.assign(iframe.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: `${widthMm}mm`,
      height: `${heightMm}mm`,
      border: "0",
      opacity: "0",
      pointerEvents: "none",
      visibility: "hidden",
    });
    document.body.appendChild(iframe);
  } else {
    // Resynchronise les dimensions si l'iframe existe déjà (ex. reçu vs A4).
    Object.assign(iframe.style, {
      width: `${widthMm}mm`,
      height: `${heightMm}mm`,
    });
  }

  return iframe.contentWindow;
}

/**
 * Ancien message popup — conservé si même l'iframe échoue (contexte sandbox rare).
 */
export function warnPopupBlocked(): void {
  window.alert(
    "Impossible d'ouvrir l'aperçu d'impression. Vérifiez que le site n'est pas en mode restreint, puis réessayez.",
  );
}

/** Attend le chargement des images avant d'ouvrir la boîte d'impression. */
export function triggerPrint(win: Window, delayMs = PRINT_WINDOW_READY_MS): void {
  // Retour visuel le temps de préparer le document (chargement du logo,
  // etc.) — sans ça le clic sur « Imprimer » ne montre rien avant que la
  // boîte de dialogue système n'apparaisse, ce qui se lit comme un blocage.
  const progress = toastLoading(toast, {
    title: "Préparation de l'impression…",
    description: UI.loading.processing,
  });
  const doPrint = () => {
    progress.dismiss();
    try {
      win.focus();
    } catch {
      // iframe cross-doc focus peut échouer — print() suffit
    }
    win.print();
  };
  const imgs = Array.from(win.document.images);
  const pending = imgs.filter((img) => !img.complete);
  if (pending.length === 0) {
    setTimeout(doPrint, delayMs);
    return;
  }
  let loaded = 0;
  const done = () => {
    loaded += 1;
    if (loaded >= pending.length) setTimeout(doPrint, PRINT_IMAGE_READY_MS);
  };
  pending.forEach((img) => {
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });
  setTimeout(doPrint, PRINT_FALLBACK_MS);
}

export interface BuildPrintDocumentOptions {
  title: string;
  body: string;
  brand: SocieteBrand;
}

/** Construit le HTML complet d'un document générique (gabarit printHTML). */
export function buildPrintDocument({ title, body, brand }: BuildPrintDocumentOptions): string {
  const letterheadHTML = buildOfficialLetterheadHTML(brand);
  const footerHTML = documentFooterHTML(brand.nom);
  const editedOn = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${htmlEscape(title)}</title>
  <style>${OFFICIAL_LETTERHEAD_CSS}
${PRINT_HTML_DOCUMENT_CSS}
  </style>
</head>
<body>
<div class="wrap">
  ${letterheadHTML}
  <section class="doc-section">
    <div class="doc-head">
      <div>
        <div class="doc-eyebrow">Document interne</div>
        <h1 class="doc-title">${htmlEscape(title)}</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-date">Édité le ${editedOn}</div>
      </div>
    </div>
  </section>
  <div class="doc-body">${body}</div>
  <div class="footer">${footerHTML}</div>
</div>
</body>
</html>`;
}

/** Écrit le HTML dans la cible d'impression (iframe) et lance print(). */
export function openPrintWindow(html: string, _windowFeatures?: string): void {
  const win = acquirePrintTarget();
  if (!win) {
    warnPopupBlocked();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  triggerPrint(win);
}

/**
 * Print a specific HTML string in a new window.
 * Useful for generating a clean PDF/document without the app chrome.
 */
export function printHTML(title: string, bodyHTML: string, brand?: SocieteBrand | null): void {
  if (!requireSocieteBrand(brand, "ce document")) return;
  openPrintWindow(buildPrintDocument({ title, body: bodyHTML, brand }));
}
