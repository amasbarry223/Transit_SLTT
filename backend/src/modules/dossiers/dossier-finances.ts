/**
 * Calculs financiers d'un dossier — fiche Excel "Situation du client".
 * Source unique côté serveur ; copie conforme côté front :
 * frontend/src/lib/domain/dossier-finances.ts (mêmes cas de test dans les deux
 * specs — toute modification doit être reportée).
 *
 *   montantPaye   = Σ paiements
 *   resteAPayer   = total contrat − montant payé   (négatif = trop-perçu)
 *   totalDepenses = Σ dépenses
 *   beneficeNet   = total contrat − total dépenses
 *
 * Montants en FCFA entiers : toute entrée est arrondie (Float historique,
 * BigInt des tables de lignes).
 */

export const CATEGORIES_DEPENSE = [
  'DOUANE',
  'TRANSPORT',
  'MANUTENTION',
  'FRAIS_PORTUAIRES',
  'AVANCE',
  'DIVERS',
] as const;

export const MODES_PAIEMENT = ['ESPECES', 'VIREMENT', 'CHEQUE', 'ORANGE_MONEY', 'WAVE'] as const;

export type StatutPaiement = 'SOLDE' | 'PARTIEL' | 'IMPAYE' | 'TROP_PERCU';

export interface FinancesDossierInput {
  totalContrat?: number | bigint | null;
  paiements?: ReadonlyArray<{ montant: number | bigint }> | null;
  depenses?: ReadonlyArray<{ montant: number | bigint }> | null;
}

export interface FinancesDossier {
  totalContrat: number;
  montantPaye: number;
  resteAPayer: number;
  totalDepenses: number;
  beneficeNet: number;
  statutPaiement: StatutPaiement;
  perte: boolean;
}

/** FCFA entier depuis number | bigint | string | null. */
export function toFcfa(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

const somme = (lignes?: ReadonlyArray<{ montant: number | bigint }> | null) =>
  (lignes ?? []).reduce((s, l) => s + toFcfa(l.montant), 0);

export function statutPaiement(totalContrat: number, montantPaye: number): StatutPaiement {
  const reste = totalContrat - montantPaye;
  if (reste < 0) return 'TROP_PERCU';
  if (montantPaye === 0 && totalContrat > 0) return 'IMPAYE';
  if (reste === 0) return 'SOLDE';
  return 'PARTIEL';
}

export function calculerFinancesDossier(d: FinancesDossierInput): FinancesDossier {
  const totalContrat = toFcfa(d.totalContrat);
  const montantPaye = somme(d.paiements);
  const totalDepenses = somme(d.depenses);
  const beneficeNet = totalContrat - totalDepenses;
  return {
    totalContrat,
    montantPaye,
    resteAPayer: totalContrat - montantPaye,
    totalDepenses,
    beneficeNet,
    statutPaiement: statutPaiement(totalContrat, montantPaye),
    perte: beneficeNet < 0,
  };
}
