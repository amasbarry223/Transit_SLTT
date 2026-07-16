import type { DevisStatut, FactureStatut } from "@/lib/domain-types";

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
  Envoyée: ["Partielle", "Soldée", "Annulée"],
  Partielle: ["Soldée", "Annulée"],
  Soldée: ["Annulée"],
  Annulée: [],
};

export function canTransitionDevis(from: DevisStatut, to: DevisStatut): boolean {
  return DEVIS_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionFacture(from: FactureStatut, to: FactureStatut): boolean {
  return FACTURE_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
