import type { ContratStatut, DevisStatut, FactureStatut, OcrJobStatus } from "@/lib/domain-types";

/**
 * Transitions manuelles autorisées pour les devis et les factures.
 * Empêche notamment de faire régresser un document déjà soldé/accepté
 * (ce qui désynchronisait montantPaye / dossierId) — voir audit du 16/07/2026.
 */
export const DEVIS_ALLOWED_TRANSITIONS: Record<DevisStatut, DevisStatut[]> = {
  Brouillon: ["Envoyé", "Refusé"],
  Envoyé: ["Accepté", "Refusé", "Expiré"],
  Accepté: [],
  Refusé: ["Brouillon"],
  Expiré: ["Brouillon"],
};

export const FACTURE_ALLOWED_TRANSITIONS: Record<FactureStatut, FactureStatut[]> = {
  Brouillon: ["Envoyée", "Annulée"],
  // "Brouillon" ajouté : le backend (factures.service.ts STATUT_TRANSITIONS.ENVOYEE)
  // autorise déjà l'annulation d'un envoi par erreur ; cette matrice frontend
  // ne le proposait pas, masquant un correctif légitime à tous les utilisateurs.
  Envoyée: ["Partielle", "Soldée", "Annulée", "Brouillon"],
  Partielle: ["Soldée", "Annulée", "Partielle"],
  Soldée: ["Annulée"],
  Annulée: [],
};

/** Matrice contrat — dupliquée côté backend (contrats.service.ts
 *  STATUT_TRANSITIONS) pour une validation serveur réelle ; à maintenir
 *  synchronisée si l'une des deux change. */
export const CONTRAT_ALLOWED_TRANSITIONS: Record<ContratStatut, ContratStatut[]> = {
  "En cours": ["Exécuté"],
  "Exécuté": ["En cours"],
  Actif: ["Exécuté", "En cours", "Suspendu", "Clôturé"],
  Suspendu: ["En cours", "Exécuté", "Actif", "Clôturé"],
  Clôturé: ["En cours", "Exécuté", "Actif"],
};

export function canTransitionDevis(from: DevisStatut, to: DevisStatut): boolean {
  return DEVIS_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionFacture(from: FactureStatut, to: FactureStatut): boolean {
  return FACTURE_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionContrat(from: ContratStatut, to: ContratStatut): boolean {
  return CONTRAT_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Matrice job OCR (§4 cahier des charges) : pending→processing→{done,failed}→validated.
 * Une "relance OCR" crée un nouveau job (createOcrJob) plutôt que de faire
 * régresser un job existant — validated/failed→pending n'est donc jamais
 * un cas légitime pour un même job.
 */
export const OCR_JOB_ALLOWED_TRANSITIONS: Record<OcrJobStatus, OcrJobStatus[]> = {
  pending: ["processing"],
  processing: ["done", "failed"],
  done: ["validated"],
  failed: ["validated"],
  validated: [],
};

export function canTransitionOcrJob(from: OcrJobStatus, to: OcrJobStatus): boolean {
  return OCR_JOB_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
