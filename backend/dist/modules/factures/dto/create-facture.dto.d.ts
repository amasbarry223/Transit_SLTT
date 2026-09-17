import { LigneFactureDto } from './ligne-facture.dto';
export declare class CreateFactureDto {
    numero: string;
    annexeId: string;
    clientId: string;
    dossierId?: string;
    dateEmission?: string;
    dateEcheance?: string;
    tauxTva?: number;
    notes?: string;
    lignes: LigneFactureDto[];
}
