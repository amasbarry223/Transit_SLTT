import {
  DEFAULT_PAIEMENT_MODE,
  DOSSIER_STATUT_SOLDE,
} from "@/lib/constants";
import type { Dossier, Ecriture, PaiementMode } from "@/lib/domain-types";

export interface DossierSoldeEcritureContext {
  /** Montant reçu à l'instant T (delta). */
  montantRecu: number;
  modePaiement?: PaiementMode;
  transitionNote?: string;
  resolvedDate: string;
  today: string;
}

export interface EcritureSoldeLocalPatch {
  ecritures: Ecriture[];
  ecritureSeq?: number;
  dossierMontantPaye: number;
}

/**
 * Enregistre localement le paiement de solde + le passage du dossier à « Soldé ».
 */
export async function syncEcritureWhenDossierSolde(
  dossier: Dossier,
  ecritures: Ecriture[],
  ecritureSeq: number,
  context: DossierSoldeEcritureContext,
): Promise<EcritureSoldeLocalPatch> {
  const existingIdx = ecritures.findIndex((e) => e.dossierId === dossier.id);
  const prevPaye = existingIdx >= 0 ? ecritures[existingIdx].montantPaye : 0;
  const newPaye = Math.min(dossier.montantInvesti, prevPaye + context.montantRecu);
  const patchedEcriture: Ecriture = {
    id: existingIdx >= 0 ? ecritures[existingIdx].id : crypto.randomUUID(),
    date: existingIdx >= 0 ? ecritures[existingIdx].date : context.today,
    datePaiement: context.resolvedDate,
    clientId: dossier.clientId,
    clientNom: dossier.clientNom,
    dossierId: dossier.id,
    annexeId: dossier.annexeId,
    annexeNom: dossier.annexeNom,
    montantInvesti: dossier.montantInvesti,
    montantPaye: newPaye,
    modePaiement: context.modePaiement ?? DEFAULT_PAIEMENT_MODE,
    note: context.transitionNote ?? `Solde dossier ${dossier.reference}`,
  };

  if (existingIdx >= 0) {
    return {
      ecritures: ecritures.map((e, i) => (i === existingIdx ? patchedEcriture : e)),
      dossierMontantPaye: newPaye,
    };
  }

  return {
    ecritures: [patchedEcriture, ...ecritures],
    ecritureSeq: ecritureSeq + 1,
    dossierMontantPaye: newPaye,
  };
}

/** Indique si une transition vers « Soldé » doit synchroniser une écriture. */
export function shouldSyncEcritureOnDossierSolde(
  newStatut: string,
  montantRecu?: number,
): montantRecu is number {
  return newStatut === DOSSIER_STATUT_SOLDE && !!montantRecu && montantRecu > 0;
}
