export declare const CATEGORIES_DEPENSE: readonly ["DOUANE", "TRANSPORT", "MANUTENTION", "FRAIS_PORTUAIRES", "AVANCE", "DIVERS"];
export declare const MODES_PAIEMENT: readonly ["ESPECES", "VIREMENT", "CHEQUE", "ORANGE_MONEY", "WAVE"];
export type StatutPaiement = 'SOLDE' | 'PARTIEL' | 'IMPAYE' | 'TROP_PERCU';
export interface FinancesDossierInput {
    totalContrat?: number | bigint | null;
    paiements?: ReadonlyArray<{
        montant: number | bigint;
    }> | null;
    depenses?: ReadonlyArray<{
        montant: number | bigint;
    }> | null;
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
export declare function toFcfa(v: unknown): number;
export declare function statutPaiement(totalContrat: number, montantPaye: number): StatutPaiement;
export declare function calculerFinancesDossier(d: FinancesDossierInput): FinancesDossier;
