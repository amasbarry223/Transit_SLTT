import { LigneDevisDto } from './ligne-devis.dto';
export declare class UpdateDevisDto {
    clientId?: string;
    annexeId?: string;
    dossierId?: string;
    portId?: string;
    nature?: string;
    ville?: string;
    pays?: string;
    numeroBordereau?: string;
    dateEmission?: string;
    dateValidite?: string;
    notes?: string;
    statut?: string;
    lignes?: LigneDevisDto[];
}
