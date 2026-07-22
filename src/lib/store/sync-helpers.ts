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
  montantPaye: number;
  modePaiement?: PaiementMode;
  transitionNote?: string;
  resolvedDate: string;
  today: string;
}

export interface EcritureSoldeLocalPatch {
  ecritures: Ecriture[];
  ecritureSeq?: number;
}

function buildSoldeDossierNote(dossier: Dossier, transitionNote?: string, existingNote?: string): string {
  const fallback = `Solde dossier ${dossier.reference}`;
  return transitionNote || existingNote || fallback;
}

/** Met à jour l'état local des écritures lors d'une transition vers « Soldé ». */
export function applyEcritureSoldeToLocalState(
  dossier: Dossier,
  ecritures: Ecriture[],
  ecritureSeq: number,
  context: DossierSoldeEcritureContext,
): EcritureSoldeLocalPatch {
  const existingIdx = ecritures.findIndex((e) => e.dossierId === dossier.id);
  const resolvedMode = context.modePaiement ?? DEFAULT_PAIEMENT_MODE;

  if (existingIdx >= 0) {
    return {
      ecritures: ecritures.map((e) =>
        e.dossierId === dossier.id
          ? {
              ...e,
              montantPaye: context.montantPaye,
              modePaiement: context.modePaiement ?? e.modePaiement,
              datePaiement: context.resolvedDate,
              note: buildSoldeDossierNote(dossier, context.transitionNote, e.note),
            }
          : e,
      ),
    };
  }

  const autoEcriture: Ecriture = {
    id: `E-${ecritureSeq}`,
    date: context.today,
    datePaiement: context.resolvedDate,
    clientId: dossier.clientId,
    clientNom: dossier.clientNom,
    dossierId: dossier.id,
    montantInvesti: dossier.montantInvesti,
    montantPaye: context.montantPaye,
    modePaiement: resolvedMode,
    note: buildSoldeDossierNote(dossier, context.transitionNote),
  };

  return {
    ecritures: [autoEcriture, ...ecritures],
    ecritureSeq: ecritureSeq + 1,
  };
}

/**
 * Crée ou met à jour l'écriture comptable lors d'une transition dossier vers « Soldé ».
 * Couvre la persistance Supabase et le patch d'état local.
 */
export async function syncEcritureWhenDossierSolde(
  dossier: Dossier,
  ecritures: Ecriture[],
  ecritureSeq: number,
  context: DossierSoldeEcritureContext,
): Promise<EcritureSoldeLocalPatch> {
  const existing = ecritures.find((e) => e.dossierId === dossier.id);
  const resolvedMode = context.modePaiement ?? existing?.modePaiement ?? DEFAULT_PAIEMENT_MODE;
  const resolvedNote = buildSoldeDossierNote(dossier, context.transitionNote, existing?.note);

  if (existing) {
    const { error } = await supabase
      .from("ecritures")
      .update({
        montant_paye: context.montantPaye,
        mode_paiement: resolvedMode,
        date_paiement: context.resolvedDate,
        note: resolvedNote,
      })
      .eq("dossier_id", dossier.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("ecritures").insert({
      date: context.today,
      date_paiement: context.resolvedDate,
      client_id: dossier.clientId,
      dossier_id: dossier.id,
      montant_investi: dossier.montantInvesti,
      montant_paye: context.montantPaye,
      mode_paiement: resolvedMode,
      note: resolvedNote,
    });
    if (error) throw error;
  }

  return applyEcritureSoldeToLocalState(dossier, ecritures, ecritureSeq, context);
}

/** Indique si une transition vers « Soldé » doit synchroniser une écriture. */
export function shouldSyncEcritureOnDossierSolde(
  newStatut: string,
  montantRecu?: number,
): montantRecu is number {
  return newStatut === DOSSIER_STATUT_SOLDE && !!montantRecu && montantRecu > 0;
}
