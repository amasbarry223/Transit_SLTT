import { LigneBonLivraisonDto } from './ligne-bon-livraison.dto';
export declare class CreateBonLivraisonDto {
    bonSortieId: string;
    date?: string;
    lignes?: LigneBonLivraisonDto[];
    transporteurId?: string;
    transporteurNom?: string;
    immatriculation?: string;
    chauffeurNom?: string;
    chauffeurTelephone?: string;
    adresseLivraison?: string;
    observations?: string;
}
