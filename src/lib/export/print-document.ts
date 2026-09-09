"use client";

import {
  PRINT_FALLBACK_MS,
  PRINT_IMAGE_READY_MS,
  PRINT_WINDOW_READY_MS,
} from "@/lib/constants";
import {
  ensureSocieteBrand,
  requireSocieteBrand,
  type SocieteBrand,
  type SocieteLegalInfo,
} from "@/lib/societe-brand";
import { logWarn } from "@/shared/logger";
import { toast } from "@/shared/hooks/use-toast";
import { toastLoading } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
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
  const resolved = ensureSocieteBrand(brand);
  const logoClass = options?.logoClass ?? "official-letterhead-logo";
  const logoImg = brandLogoImgHTML(resolved, logoClass, "v=transparent2");
  const displayName = resolved.raisonSociale || resolved.nom;
  const showName = resolved.afficherNomAvecLogo !== false;
  const nameLines = showName ? splitRaisonSocialeLines(displayName) : [];
  const nameHTML = nameLines
    .map((line) => `<div class="official-letterhead-name-line">${htmlEscape(line.toUpperCase())}</div>`)
    .join("\n");
  const l = resolved.legal;

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
  const resolved = ensureSocieteBrand(brand);
  const legalLine = buildLegalLine(resolved.legal);
  if (legalLine) return legalLine;
  if (resolved.afficherNomAvecLogo === false) return "";
  return htmlEscape(resolved.nom);
}

/**
 * Impression via iframe dédiée et isolée (évite le blocage des popups).
 * Conçu selon les meilleures pratiques modernes (Chrome/Edge/Safari/Firefox) :
 * - Toujours un iframe neuf (supprime tout iframe précédent pour éviter les blocages Chromium post-print).
 * - Ne JAMAIS utiliser visibility:hidden ni display:none (qui provoquent des impressions blanches).
 * - Positionnement dans le viewport avec opacité 0.001 et z-index négatif.
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

  // Supprimer tout iframe existant pour repartir sur un contexte vierge
  const existing = document.getElementById(frameId);
  if (existing) {
    try {
      existing.remove();
    } catch {
      // ignore
    }
  }

  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.name = frameId;
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Impression SLTT");
  iframe.setAttribute("tabindex", "-1");

  // Rendu valide pour le moteur de rasterisation print du navigateur :
  // Visible pour le moteur de rendu mais transparent et cliquable au travers pour l'utilisateur
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0px",
    bottom: "0px",
    width: `${widthMm}mm`,
    height: `${heightMm}mm`,
    border: "none",
    margin: "0",
    padding: "0",
    opacity: "0.001",
    pointerEvents: "none",
    zIndex: "-99999",
  });

  document.body.appendChild(iframe);
  return iframe.contentWindow;
}

/**
 * Message d'aide si l'impression échoue.
 */
export function warnPopupBlocked(): void {
  toast({
    title: "Impression impossible",
    description: "Vérifiez que votre navigateur autorise l'impression ou l'ouverture de fenêtres pour ce site.",
    variant: "destructive",
  });
}

/** Attend le chargement des images et des polices avant d'ouvrir la boîte d'impression. */
export function triggerPrint(win: Window, delayMs = PRINT_WINDOW_READY_MS): void {
  const progress = toastLoading(toast, {
    title: "Préparation de l'impression…",
    description: UI.loading.processing,
  });

  let hasExecuted = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    try {
      progress.dismiss();
    } catch {
      // ignore
    }
  };

  const doPrint = () => {
    if (hasExecuted) return;
    hasExecuted = true;
    cleanup();

    try {
      win.focus();
    } catch {
      // ignore
    }

    try {
      win.print();
    } catch (err) {
      logWarn("Échec de window.print() sur l'iframe, bascule vers fenêtre directe", err);
      try {
        const popup = window.open("", "_blank");
        if (popup && win.document) {
          popup.document.open();
          popup.document.write(win.document.documentElement.outerHTML);
          popup.document.close();
          popup.focus();
          popup.print();
          return;
        }
      } catch {
        // popup bloqué
      }
      toast({
        title: "Impression impossible",
        description: "Vérifiez que votre navigateur autorise l'impression.",
        variant: "destructive",
      });
    }
  };

  // Nettoyage de l'iframe après fermeture du dialogue d'impression
  try {
    win.addEventListener(
      "afterprint",
      () => {
        cleanup();
        setTimeout(() => {
          try {
            const frame = win.frameElement as HTMLElement | null;
            if (frame) frame.remove();
          } catch {
            // ignore
          }
        }, 1000);
      },
      { once: true },
    );
  } catch {
    // ignore
  }

  // Inspection des ressources document (images & fonts)
  try {
    const doc = win.document;
    if (!doc) {
      setTimeout(doPrint, delayMs);
      return;
    }

    const imgs = Array.from(doc.images || []);
    const pending = imgs.filter((img) => !img.complete && img.src);

    const waitForFonts = () => {
      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready
          .then(() => setTimeout(doPrint, delayMs))
          .catch(() => setTimeout(doPrint, delayMs));
      } else {
        setTimeout(doPrint, delayMs);
      }
    };

    if (pending.length === 0) {
      waitForFonts();
    } else {
      let loaded = 0;
      const onDone = () => {
        loaded += 1;
        if (loaded >= pending.length) {
          waitForFonts();
        }
      };
      pending.forEach((img) => {
        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true });
      });
    }
  } catch {
    setTimeout(doPrint, delayMs);
  }

  fallbackTimer = setTimeout(doPrint, PRINT_FALLBACK_MS);
}

export interface BuildPrintDocumentOptions {
  title: string;
  body: string;
  brand: SocieteBrand;
}

/** Construit le HTML complet d'un document générique (gabarit printHTML). */
export function buildPrintDocument({ title, body, brand }: BuildPrintDocumentOptions): string {
  const resolved = ensureSocieteBrand(brand);
  const letterheadHTML = buildOfficialLetterheadHTML(resolved);
  const footerHTML = documentFooterHTML(resolved.nom);
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
        <div class="doc-eyebrow">Document officiel</div>
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

export interface PrintHtmlDocumentOptions {
  html: string;
  title?: string;
  widthMm?: number;
  heightMm?: number;
  frameId?: string;
  delayMs?: number;
}

/**
 * Moteur universel d'impression HTML.
 * Prépare la cible, injecte le HTML de façon sécurisée et déclenche l'impression.
 */
export function printHtmlDocument(options: PrintHtmlDocumentOptions | string): void {
  const opts = typeof options === "string" ? { html: options } : options;
  const win = acquirePrintTarget({
    widthMm: opts.widthMm,
    heightMm: opts.heightMm,
    frameId: opts.frameId,
  });
  if (!win) {
    warnPopupBlocked();
    return;
  }

  try {
    win.document.open();
    win.document.write(opts.html);
    win.document.close();
  } catch {
    const frame = win.frameElement as HTMLIFrameElement | null;
    if (frame) frame.srcdoc = opts.html;
  }

  triggerPrint(win, opts.delayMs);
}

/** Écrit le HTML dans la cible d'impression (iframe) et lance print(). */
export function openPrintWindow(html: string, _windowFeatures?: string): void {
  printHtmlDocument(html);
}

/**
 * Imprime un fragment HTML arbitraire avec en-tête et pied de page officiel.
 */
export function printHTML(title: string, bodyHTML: string, brand?: SocieteBrand | null): void {
  const resolvedBrand = ensureSocieteBrand(brand);
  openPrintWindow(buildPrintDocument({ title, body: bodyHTML, brand: resolvedBrand }));
}
