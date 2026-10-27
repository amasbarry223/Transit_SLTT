import type { ContratStatut, DevisStatut } from "@/lib/domain-types";

/** Transitions devis nécessitant une confirmation explicite avant application. */
const DEVIS_STATUTS_NEED_CONFIRM: DevisStatut[] = ["Accepté", "Refusé", "Expiré"];

/** Transitions contrat nécessitant une confirmation explicite avant application. */
const CONTRAT_STATUTS_NEED_CONFIRM: ContratStatut[] = ["Clôturé", "Suspendu"];

export function devisStatutNeedsConfirm(statut: DevisStatut): boolean {
  return DEVIS_STATUTS_NEED_CONFIRM.includes(statut);
}

export function contratStatutNeedsConfirm(statut: ContratStatut): boolean {
  return CONTRAT_STATUTS_NEED_CONFIRM.includes(statut);
}
