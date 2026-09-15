import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LigneFactureDto } from './ligne-facture.dto';

/**
 * Les lignes ne sont recalculées QUE si `lignes` est explicitement fourni
 * (voir factures.service.ts::update, hasLignes) — d'où @IsOptional() ici,
 * contrairement à CreateFactureDto où elles sont obligatoires.
 */
export class UpdateFactureDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  dossierId?: string;

  @IsDateString()
  @IsOptional()
  dateEmission?: string;

  @IsDateString()
  @IsOptional()
  dateEcheance?: string;

  @IsNumber()
  @IsOptional()
  tauxTva?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneFactureDto)
  @IsOptional()
  lignes?: LigneFactureDto[];
}
