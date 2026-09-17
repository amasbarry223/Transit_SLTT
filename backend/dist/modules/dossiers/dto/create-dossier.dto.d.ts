import { DossierFieldsDto } from './dossier-fields.dto';
export declare class CreateDossierDto extends DossierFieldsDto {
    annexeId: string;
    clientId: string;
    montantPaye?: number;
    dateSolde?: string;
}
