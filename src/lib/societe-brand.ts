/**
 * Résolution dynamique de l'identité société — source unique pour l'UI,
 * les exports PDF et le Classeur. Évite les noms/UUID/adresses codés en dur.
 */
import type { Annexe, Societe } from "@/lib/domain-types";

/** UUID historique SLTT transit — repli si is_transit absent en base. */
export const LEGACY_TRANSIT_SOCIETE_ID = "22222222-2222-2222-2222-222222222222";

export interface SocieteLegalInfo {
  adresse?: string;
  telephone?: string;
  rccm?: string;
  nif?: string;
}

/** Identité d'une société pour l'en-tête d'un document imprimé. */
export interface SocieteBrand {
  nom: string;
  /** Nom légal complet pour les documents qui reproduisent le papier à en-tête officiel — repli sur `nom` si absent. */
  raisonSociale?: string;
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

const SOCIETE_TONES = ["blue", "slate"] as const;

/**
 * Ton badge société — indigo si transit, sinon bleu/gris déterministe
 * (plus de mapping UUID seed hardcodé).
 */
export function societeToneById(
  societeId: string,
  options?: { isTransit?: boolean },
): "blue" | "indigo" | "slate" {
  if (options?.isTransit) return "indigo";
  // Repli legacy si le flag is_transit n'est pas encore hydraté côté client.
  if (societeId === LEGACY_TRANSIT_SOCIETE_ID) return "indigo";
  let hash = 0;
  for (let i = 0; i < societeId.length; i++) {
    hash = (hash + societeId.charCodeAt(i) * (i + 1)) % 997;
  }
  return SOCIETE_TONES[hash % SOCIETE_TONES.length];
}

/**
 * Société porteuse du transit (flag is_transit, sinon UUID legacy, sinon —
 * seulement si aucune ambiguïté possible — l'unique société active).
 * Ne devine jamais parmi plusieurs sociétés actives non flaguées : le
 * branding sert aussi à l'identité légale imprimée (RCCM/NIF/logo) sur les
 * factures/devis, donc un mauvais choix silencieux serait pire qu'un champ
 * vide. `requireSocieteBrand`/`requirePrintHTMLBrand` gèrent déjà le cas
 * "non configuré" avec un avertissement explicite.
 */
export function resolveTransitSociete(societes: Societe[]): Societe | undefined {
  const flagged = societes.find((s) => s.isTransit);
  if (flagged) return flagged;
  const legacy = societes.find((s) => s.id === LEGACY_TRANSIT_SOCIETE_ID);
  if (legacy) return legacy;
  const actives = societes.filter((s) => s.actif);
  return actives.length === 1 ? actives[0] : undefined;
}

/** Annexe visible uniquement pour la société transit (SLTT) — cf. bon de sortie caisse. */
export function shouldShowAnnexeForSociete(
  societeId: string,
  societes: Societe[],
  annexes: Annexe[],
): boolean {
  if (!societeId || annexes.length <= 1) return false;
  const transitId = resolveTransitSociete(societes)?.id;
  return societeId === transitId;
}

/**
 * Préfixe des références dossier — dérivé du nom (éditable) de la société
 * transit, avec repli si aucune société n'est encore configurée (compte
 * flambant neuf, avant tout paramétrage).
 */
export function resolveDossierReferencePrefix(societes: Societe[]): string {
  return resolveTransitSociete(societes)?.nom || "TR";
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
    raisonSociale: s.raisonSociale,
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

/** Branding shell (topbar, login) — nom + logo depuis la société transit. */
export function resolveAppShellBranding(societes: Societe[]): {
  appTitle: string;
  appSubtitle: string;
  logoUrl?: string;
} {
  const s = resolveTransitSociete(societes);
  return {
    appTitle: s?.nom ?? "Transit",
    appSubtitle: "Plateforme de gestion logistique et transit",
    logoUrl: s?.logoUrl,
  };
}

/**
 * Fusionne l'identité légale d'une annexe (adresse/téléphone/RCCM/NIF,
 * lieu d'émission physique) dans le branding société (nom/logo — l'annexe
 * n'a pas son propre logo, c'est une déclinaison de coordonnées de la même
 * entreprise). Utilisé pour l'en-tête des factures par annexe (F4).
 */
export function mergeAnnexeIntoBrand(brand: SocieteBrand, annexe: Annexe): SocieteBrand {
  return {
    ...brand,
    legal: {
      adresse: annexe.adresse,
      telephone: annexe.telephone,
      rccm: annexe.rccm,
      nif: annexe.nif,
    },
  };
}

export interface DossierCoutLabels {
  droitDouane: string;
  droitDouaneHint: string;
  fraisCircuit: string;
  fraisCircuitHint: string;
  fraisPrestation: string;
  fraisPrestationHint: string;
}

const DEFAULT_DOSSIER_COUT_LABELS: DossierCoutLabels = {
  droitDouane: "Droit de douane",
  droitDouaneHint: "Taxe versée à la douane pour dédouaner la marchandise.",
  fraisCircuit: "Frais de circuit global",
  fraisCircuitHint: "Frais de transit (manutention, transport local, formalités) hors droit de douane.",
  fraisPrestation: "Frais de prestation",
  fraisPrestationHint: "Rémunération de SLTT pour le service de transit — c'est elle qui détermine la marge du dossier.",
};

/**
 * Rubriques par annexe (F-ANNEXE). Mali garde le triptyque douane/circuit/
 * prestation ; la Côte d'Ivoire facture par transit portuaire (cf. facture
 * CI type — conteneurs/compagnie/bordereau, sans droit de douane affiché) :
 * "Frais transit port" remplace la douane, "Dépenses" remplace le circuit.
 */
const ANNEXE_DOSSIER_COUT_LABELS: Record<string, Partial<DossierCoutLabels>> = {
  CI: {
    droitDouane: "Frais transit port",
    droitDouaneHint: "Frais de transit portuaire (manutention, passage port) — annexe Côte d'Ivoire.",
    fraisCircuit: "Dépenses",
    fraisCircuitHint: "Dépenses diverses engagées pour le dossier, hors frais de transit portuaire.",
  },
};

/**
 * Libellés affichés pour la décomposition de coûts d'un dossier (formulaire,
 * détail, impressions, lignes de facture pré-remplies). Le modèle reste 3
 * montants partout (marge, exports, bilans) — seuls les intitulés changent
 * par annexe, jamais les champs stockés ni le calcul de marge/écart.
 */
export function resolveDossierCoutLabels(annexeCode?: string | null): DossierCoutLabels {
  const override = annexeCode ? ANNEXE_DOSSIER_COUT_LABELS[annexeCode] : undefined;
  return override ? { ...DEFAULT_DOSSIER_COUT_LABELS, ...override } : DEFAULT_DOSSIER_COUT_LABELS;
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
