/**
 * Helpers partagés pour les trois canaux de paiement :
 * écritures (comptabilité), factures, transitions dossier « Soldé ».
 */

export function validatePaymentAmount(montant: number, reste: number): number {
  if (!montant || montant <= 0) {
    throw new Error("Le montant doit être supérieur à 0.");
  }
  if (montant > reste) {
    throw new Error(
      `Le montant ne peut pas dépasser le reste à payer (${reste.toLocaleString("fr-FR")} FCFA).`,
    );
  }
  return Math.min(reste, montant);
}

export function computeIncrementalPaye(
  currentPaye: number,
  plafond: number,
  montant: number,
): number {
  if (!montant || montant <= 0) {
    throw new Error("Le montant doit être supérieur à 0.");
  }
  const reste = Math.max(0, plafond - currentPaye);
  const effective = Math.min(reste, montant);
  return Math.min(plafond, currentPaye + effective);
}

export type PaymentSourceType = "ecriture" | "facture" | "dossier";

export interface PaymentSource {
  type: PaymentSourceType;
  id: string;
  montant: number;
}
