import { supabase } from "@/lib/supabase";
import {
  DEFAULT_PAIEMENT_MODE,
  DOSSIER_STATUT_SOLDE,
} from "@/lib/constants";
import type { Dossier, Ecriture, PaiementMode } from "@/lib/domain-types";

/** Somme des montants payés sur les écritures liées à un dossier. */
export function sumEcrituresPayeForDossier(dossierId: string, ecritures: Ecriture[]): number {
  return ecritures
    .filter((e) => e.dossierId === dossierId)
    .reduce((sum, e) => sum + e.montantPaye, 0);
}

/** Plafonne le montant payé au montant investi du dossier. */
export function capDossierMontantPaye(totalPaye: number, montantInvesti: number): number {
  return Math.min(montantInvesti, Math.max(0, totalPaye));
}

/**
 * Recalcule le montant payé d'un dossier à partir de ses écritures et persiste en base.
 * Utilisé par recordPayment et addEcriture.
 */
export async function syncDossierPayeFromEcritures(
  dossierId: string,
  ecritures: Ecriture[],
  dossier: Pick<Dossier, "montantInvesti">,
): Promise<number> {
  const totalPaye = sumEcrituresPayeForDossier(dossierId, ecritures);
  const montantPaye = capDossierMontantPaye(totalPaye, dossier.montantInvesti);

  const { error } = await supabase
    .from("dossiers")
    .update({ montant_paye: montantPaye })
    .eq("id", dossierId);
  if (error) throw error;

  return montantPaye;
}

export interface DossierSoldeEcritureContext {
  /** Montant reçu à l'instant T (delta) — le calcul du cumul est fait en DB, atomiquement. */
  montantRecu: number;
  modePaiement?: PaiementMode;
  transitionNote?: string;
  resolvedDate: string;
  today: string;
}

export interface EcritureSoldeLocalPatch {
  ecritures: Ecriture[];
  ecritureSeq?: number;
  /** Montant payé du dossier tel que recalculé par la DB (sum(ecritures) authoritative). */
  dossierMontantPaye: number;
}

interface RecordDossierSoldePaiementRow {
  dossier_montant_paye: number | string;
  ecriture_id: string;
  ecriture_montant_paye: number | string;
  ecriture_mode_paiement: PaiementMode | null;
  ecriture_date_paiement: string | null;
  ecriture_note: string | null;
}

/**
 * Enregistre atomiquement le paiement de solde + le passage du dossier à
 * « Soldé » via le RPC record_dossier_solde_paiement (verrou dossier +
 * écriture côté Postgres, cumul calculé en DB). Remplace l'ancien calcul
 * client (lecture état local + Math.min/max + deux .update() séparés) qui
 * pouvait faire perdre un paiement en cas de transitions concurrentes.
 */
export async function syncEcritureWhenDossierSolde(
  dossier: Dossier,
  ecritures: Ecriture[],
  ecritureSeq: number,
  context: DossierSoldeEcritureContext,
): Promise<EcritureSoldeLocalPatch> {
  const { data, error } = await supabase.rpc("record_dossier_solde_paiement", {
    p_dossier_id: dossier.id,
    p_montant: context.montantRecu,
    p_mode: context.modePaiement ?? null,
    p_date: context.resolvedDate,
    p_note: context.transitionNote ?? null,
  });
  if (error) throw error;
  const row = (data as RecordDossierSoldePaiementRow[] | null)?.[0];
  if (!row) throw new Error("Réponse inattendue du serveur lors du solde du dossier.");

  const dossierMontantPaye = Number(row.dossier_montant_paye);
  const existingIdx = ecritures.findIndex((e) => e.dossierId === dossier.id);
  const patchedEcriture: Ecriture = {
    id: row.ecriture_id,
    date: existingIdx >= 0 ? ecritures[existingIdx].date : context.today,
    datePaiement: row.ecriture_date_paiement ?? context.resolvedDate,
    clientId: dossier.clientId,
    clientNom: dossier.clientNom,
    dossierId: dossier.id,
    annexeId: dossier.annexeId,
    annexeNom: dossier.annexeNom,
    montantInvesti: existingIdx >= 0 ? ecritures[existingIdx].montantInvesti : dossier.montantInvesti,
    montantPaye: Number(row.ecriture_montant_paye),
    modePaiement: row.ecriture_mode_paiement ?? context.modePaiement ?? DEFAULT_PAIEMENT_MODE,
    note: row.ecriture_note ?? `Solde dossier ${dossier.reference}`,
  };

  if (existingIdx >= 0) {
    return {
      ecritures: ecritures.map((e, i) => (i === existingIdx ? patchedEcriture : e)),
      dossierMontantPaye,
    };
  }

  return {
    ecritures: [patchedEcriture, ...ecritures],
    ecritureSeq: ecritureSeq + 1,
    dossierMontantPaye,
  };
}

/** Indique si une transition vers « Soldé » doit synchroniser une écriture. */
export function shouldSyncEcritureOnDossierSolde(
  newStatut: string,
  montantRecu?: number,
): montantRecu is number {
  return newStatut === DOSSIER_STATUT_SOLDE && !!montantRecu && montantRecu > 0;
}
