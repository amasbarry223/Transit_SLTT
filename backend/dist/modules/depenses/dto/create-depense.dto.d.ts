declare enum CategorieDepenseDto {
    DOUANE = "DOUANE",
    PORT = "PORT",
    TRANSPORT = "TRANSPORT",
    MANUTENTION = "MANUTENTION",
    ASSURANCE = "ASSURANCE",
    DIVERS = "DIVERS"
}
export declare class CreateDepenseDto {
    numero: string;
    annexeId: string;
    dossierId?: string;
    fournisseurId?: string;
    categorie?: CategorieDepenseDto;
    montant: number;
    devise?: string;
    justificatif?: string;
    description?: string;
    dateDepense?: string;
}
export {};
