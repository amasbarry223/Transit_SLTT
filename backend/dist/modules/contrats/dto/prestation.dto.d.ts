export declare const STATUTS_PRESTATION: readonly ["En attente", "Exécuté", "Prévue", "Réalisée", "Annulée"];
export declare class CreatePrestationDto {
    libelle: string;
    description?: string;
    montant?: number;
    statut?: string;
    datePrevue?: string;
    dateRealisation?: string;
}
export declare class UpdatePrestationDto {
    libelle?: string;
    description?: string;
    montant?: number;
    statut?: string;
    datePrevue?: string;
    dateRealisation?: string;
    facturee?: boolean;
}
