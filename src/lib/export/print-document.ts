"use client";

import {
  PRINT_FALLBACK_MS,
  PRINT_IMAGE_READY_MS,
  PRINT_WINDOW_READY_MS,
} from "@/lib/constants";
import {
  requirePrintHTMLBrand,
  type PrintHTMLBrand,
  type SocieteBrand,
  type SocieteLegalInfo,
} from "@/lib/societe-brand";
import { toast } from "@/hooks/use-toast";
import { htmlEscape } from "./html-escape";
import { PRINT_HTML_DOCUMENT_CSS } from "./print-styles";

/** Résout un chemin de logo en URL absolue pour la fenêtre d'impression. */
export function resolveLogoUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (typeof window === "undefined" || /^https?:\/\//.test(path)) return path;
  return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function brandLogoImgHTML(brand: SocieteBrand, className = "brand-logo"): string {
  const url = resolveLogoUrl(brand.logoUrl);
  if (!url) return "";
  return `<img src="${url}" alt="${htmlEscape(brand.nom)}" class="${className}" onerror="this.style.display='none'">`;
}

function printHTMLLogoImg(brand: PrintHTMLBrand, className = "brand-logo"): string {
  const url = resolveLogoUrl(brand.logoUrl);
  if (!url) return "";
  return `<img class="${className}" src="${url}" alt="${htmlEscape(brand.name ?? "")}" onerror="this.style.display='none'" />`;
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

export function acquirePrintTarget(): Window | null {
  if (typeof document === "undefined") return null;

  let iframe = document.getElementById(PRINT_FRAME_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = PRINT_FRAME_ID;
    iframe.name = PRINT_FRAME_ID;
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("title", "Impression SLTT");
    iframe.setAttribute("tabindex", "-1");
    // Dimensions réelles (A4) requises : une iframe 0×0 fait caler
    // indéfiniment la génération d'aperçu du dialogue d'impression système
    // (imprimante physique) sous Chromium, même si « Enregistrer en PDF »
    // et les navigateurs mobiles (pas de round-trip vers un pilote système)
    // ne sont pas affectés — d'où le symptôme desktop-only.
    Object.assign(iframe.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "21cm",
      height: "29.7cm",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
      visibility: "hidden",
    });
    document.body.appendChild(iframe);
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
  const progress = toast({
    title: "Préparation de l'impression…",
    description: "La boîte de dialogue va s'ouvrir dans un instant.",
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
  brand: PrintHTMLBrand;
}

/** Construit le HTML complet d'un document générique (gabarit printHTML). */
export function buildPrintDocument({ title, body, brand }: BuildPrintDocumentOptions): string {
  const logoImg = printHTMLLogoImg(brand);
  const brandName = brand.name!;
  const legalLine = brand.legal ? buildLegalLine(brand.legal) : "";
  const brandSubHTML = brand.legal ? "" : htmlEscape(brand.sub ?? brand.name!);
  const footerHTML = legalLine || platformFooterHTML(brandName);
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
  <style>${PRINT_HTML_DOCUMENT_CSS}
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="brand">
      ${logoImg}
      ${brand?.afficherNomAvecLogo === false ? "" : `
      <div>
        <div class="brand-name">${htmlEscape(brandName)}</div>
        ${brandSubHTML ? `<div class="brand-sub">${brandSubHTML}</div>` : ""}
      </div>`}
    </div>
    <div class="doc-meta">
      <div style="font-weight:600;color:#1f2937">${title}</div>
      <div>Édité le ${editedOn}</div>
    </div>
  </div>
  ${body}
  <div class="footer">${footerHTML}</div>
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
export function printHTML(title: string, bodyHTML: string, brand?: PrintHTMLBrand | null): void {
  if (!requirePrintHTMLBrand(brand, "ce document")) return;
  openPrintWindow(buildPrintDocument({ title, body: bodyHTML, brand }));
}
