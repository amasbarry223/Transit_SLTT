import { LigneBonLivraisonDto } from './ligne-bon-livraison.dto';
export declare const STATUTS_BON_LIVRAISON: readonly ["En cours", "Livré"];
export declare class UpdateBonLivraisonDto {
    date?: string;
    lignes?: LigneBonLivraisonDto[];
    transporteurId?: string;
    transporteurNom?: string;
    immatriculation?: string;
    chauffeurNom?: string;
    chauffeurTelephone?: string;
    adresseLivraison?: string;
    observations?: string;
    statut?: (typeof STATUTS_BON_LIVRAISON)[number];
}
