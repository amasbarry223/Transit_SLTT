import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LigneBonLivraisonDto } from './ligne-bon-livraison.dto';

export const STATUTS_BON_LIVRAISON = ['En cours', 'Livré'] as const;

export class UpdateBonLivraisonDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneBonLivraisonDto)
  @IsOptional()
  lignes?: LigneBonLivraisonDto[];

  @IsString()
  @IsOptional()
  transporteurId?: string;

  @IsString()
  @IsOptional()
  transporteurNom?: string;

  @IsString()
  @IsOptional()
  immatriculation?: string;

  @IsString()
  @IsOptional()
  chauffeurNom?: string;

  @IsString()
  @IsOptional()
  chauffeurTelephone?: string;

  @IsString()
  @IsOptional()
  adresseLivraison?: string;

  @IsString()
  @IsOptional()
  observations?: string;

  @IsIn(STATUTS_BON_LIVRAISON)
  @IsOptional()
  statut?: (typeof STATUTS_BON_LIVRAISON)[number];
}
