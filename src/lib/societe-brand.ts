/**
 * Résolution dynamique de l'identité société — source unique pour l'UI,
 * les exports PDF et le Classeur. Évite les noms/UUID/adresses codés en dur.
 */
import type { Societe } from "@/lib/domain-types";

/** UUID historique SLTT transit — repli si is_transit absent en base. */
export const LEGACY_TRANSIT_SOCIETE_ID = "22222222-2222-2222-2222-222222222222";

/** @deprecated Préférer resolveTransitSociete — conservé pour imports existants. */
export const SLTT_SOCIETE_ID = LEGACY_TRANSIT_SOCIETE_ID;

export interface SocieteLegalInfo {
  adresse?: string;
  telephone?: string;
  rccm?: string;
  nif?: string;
}

/** Identité d'une société pour l'en-tête d'un document imprimé. */
export interface SocieteBrand {
  nom: string;
  logoUrl?: string;
  legal?: SocieteLegalInfo;
  /** false si le logo contient déjà le nom en toutes lettres (répéter le nom en texte serait redondant). */
  afficherNomAvecLogo?: boolean;
}

export interface PrintHTMLBrand {
  logoUrl?: string;
  name?: string;
  sub?: string;
  legal?: SocieteLegalInfo;
  afficherNomAvecLogo?: boolean;
}

const SOCIETE_TONE_BY_ID: Record<string, "blue" | "indigo" | "slate"> = {
  "11111111-1111-1111-1111-111111111111": "blue",
  [LEGACY_TRANSIT_SOCIETE_ID]: "indigo",
};

/** Société porteuse du transit (flag is_transit, sinon UUID legacy). */
export function resolveTransitSociete(societes: Societe[]): Societe | undefined {
  return (
    societes.find((s) => s.isTransit) ??
    societes.find((s) => s.id === LEGACY_TRANSIT_SOCIETE_ID) ??
    societes.find((s) => s.actif)
  );
}

/**
 * Préfixe des références dossier — dérivé du nom (éditable) de la société
 * transit, avec repli si aucune société n'est encore configurée (compte
 * flambant neuf, avant tout paramétrage).
 */
export function resolveDossierReferencePrefix(societes: Societe[]): string {
  return resolveTransitSociete(societes)?.nom || "SLTT";
}

/** Libellé affiché uniforme (Classeur, badges, exports) — toujours le nom en base, éditable depuis Paramètres. */
export function resolveSocieteDisplayName(societe: Pick<Societe, "nom">): string {
  return societe.nom;
}

export function resolveSocieteDisplayNameById(
  societes: Societe[],
  societeId: string,
  fallback = "Non affecté",
): string {
  const societe = societes.find((item) => item.id === societeId);
  if (!societe) return fallback;
  return resolveSocieteDisplayName(societe);
}

export function societeToBrand(s: Societe): SocieteBrand {
  return {
    nom: s.nom,
    logoUrl: s.logoUrl,
    afficherNomAvecLogo: s.afficherNomAvecLogo,
    legal: {
      adresse: s.adresse,
      telephone: s.telephone,
      rccm: s.rccm,
      nif: s.nif,
    },
  };
}

export function societeToPrintHTMLBrand(s: Societe): PrintHTMLBrand {
  return {
    logoUrl: s.logoUrl,
    name: s.nom,
    afficherNomAvecLogo: s.afficherNomAvecLogo,
    legal: {
      adresse: s.adresse,
      telephone: s.telephone,
      rccm: s.rccm,
      nif: s.nif,
    },
  };
}

/** Branding dynamique pour l'impression du classeur (filtre société ou transit par défaut). */
export function resolveClasseurPrintBrand(
  societes: Societe[],
  filterSocieteId?: string,
): SocieteBrand | null {
  if (filterSocieteId && filterSocieteId !== "all") {
    const societe = societes.find((item) => item.id === filterSocieteId);
    if (societe) {
      return { ...societeToBrand(societe), nom: resolveSocieteDisplayName(societe) };
    }
  }
  const transit = resolveTransitSociete(societes);
  if (!transit) return null;
  return { ...societeToBrand(transit), nom: resolveSocieteDisplayName(transit) };
}
/** Identité transit pour impressions (devis, classeur, listes…). */
export function resolveSlttBrand(societes: Societe[]): SocieteBrand | null {
  const s = resolveTransitSociete(societes);
  return s ? { ...societeToBrand(s), nom: resolveSocieteDisplayName(s) } : null;
}

export function resolvePrintHTMLBrand(societes: Societe[]): PrintHTMLBrand | null {
  const s = resolveTransitSociete(societes);
  return s ? societeToPrintHTMLBrand(s) : null;
}

export function societeToneById(societeId: string): "blue" | "indigo" | "slate" {
  return SOCIETE_TONE_BY_ID[societeId] ?? "slate";
}

/** Branding shell (topbar, login) — nom + logo depuis la société transit. */
export function resolveAppShellBranding(societes: Societe[]): {
  appTitle: string;
  appSubtitle: string;
  logoUrl?: string;
} {
  const s = resolveTransitSociete(societes);
  return {
    appTitle: s?.nom ?? "Transit SLTT",
    appSubtitle: "Plateforme de gestion logistique et transit",
    logoUrl: s?.logoUrl,
  };
}

export const MISSING_SIGNATORY_LABEL = "Non renseigné";

export function warnMissingBrand(context: string): boolean {
  window.alert(
    `Impossible d'imprimer ${context} : identité de la société non configurée. Renseignez-la dans Paramètres > Sociétés.`,
  );
  return false;
}

export function requireSocieteBrand(
  brand: SocieteBrand | null | undefined,
  context: string,
): brand is SocieteBrand {
  if (brand?.nom?.trim()) return true;
  return warnMissingBrand(context);
}

export function requirePrintHTMLBrand(
  brand: PrintHTMLBrand | null | undefined,
  context: string,
): brand is PrintHTMLBrand {
  if (brand?.name?.trim()) return true;
  return warnMissingBrand(context);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveBrandLogoUrl(path?: string, origin?: string): string | undefined {
  if (!path?.trim()) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function buildLegalLineHTML(info?: SocieteLegalInfo): string {
  if (!info) return "";
  return [
    info.adresse ? escapeHtml(info.adresse) : "",
    info.telephone ? `Tél. : ${escapeHtml(info.telephone)}` : "",
    info.rccm ? `RCCM : ${escapeHtml(info.rccm)}` : "",
    info.nif ? `NIF : ${escapeHtml(info.nif)}` : "",
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");
}

/** Ligne légale en texte brut (aperçu UI facture). */
export function formatSocieteLegalLine(info?: SocieteLegalInfo): string {
  if (!info) return "";
  return [
    info.adresse,
    info.telephone ? `Tél. : ${info.telephone}` : "",
    info.rccm ? `RCCM : ${info.rccm}` : "",
    info.nif ? `NIF : ${info.nif}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function hasSocieteLogo(brand: SocieteBrand): boolean {
  return Boolean(brand.logoUrl?.trim());
}

export interface InvoiceBrandBlocks {
  headerHTML: string;
  footerLegalHTML: string;
  hasLogo: boolean;
}

/**
 * En-tête facture : logo seul agrandi si logoUrl présent (sans nom/NIF à côté).
 * Infos légales déplacées en pied de page en mode logo-only.
 */
export function buildInvoiceBrandBlocks(
  brand: SocieteBrand,
  origin?: string,
): InvoiceBrandBlocks {
  const hasLogo = hasSocieteLogo(brand);
  const legalLineHTML = buildLegalLineHTML(brand.legal);

  if (hasLogo) {
    const url = resolveBrandLogoUrl(brand.logoUrl, origin);
    const logoImg = url
      ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(brand.nom)}" class="brand-logo" onerror="this.style.display='none'">`
      : "";
    return {
      hasLogo: true,
      headerHTML: `<div class="brand brand--logo-only">${logoImg}</div>`,
      footerLegalHTML: legalLineHTML,
    };
  }

  const subBlock = legalLineHTML ? `<div class="brand-sub">${legalLineHTML}</div>` : "";
  return {
    hasLogo: false,
    headerHTML: `<div class="brand"><div><div class="brand-name">${escapeHtml(brand.nom)}</div>${subBlock}</div></div>`,
    footerLegalHTML: "",
  };
}
