import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LigneBonLivraisonDto } from './ligne-bon-livraison.dto';

/** Client, annexe et (par défaut) lignes viennent du bon de sortie d'origine,
 *  jamais du client HTTP : seul le transport et la livraison se saisissent. */
export class CreateBonLivraisonDto {
  @IsString()
  bonSortieId!: string;

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
}
