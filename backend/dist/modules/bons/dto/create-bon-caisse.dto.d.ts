import { LigneBonCaisseDto } from './ligne-bon-caisse.dto';
export declare class CreateBonCaisseDto {
    reference: string;
    date?: string;
    annexeId: string;
    montantTotal?: number;
    creePar?: string;
    lignes: LigneBonCaisseDto[];
}
