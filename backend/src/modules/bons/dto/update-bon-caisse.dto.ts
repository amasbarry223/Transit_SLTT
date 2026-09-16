import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LigneBonCaisseDto } from './ligne-bon-caisse.dto';

export class UpdateBonCaisseDto {
  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  annexeId?: string;

  /** `lignes` n'est recalculé/remplacé que s'il est explicitement fourni
   *  (voir bons.service.ts::updateBonCaisse, hasLignes). */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneBonCaisseDto)
  @IsOptional()
  lignes?: LigneBonCaisseDto[];
}
