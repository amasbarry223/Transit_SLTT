import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LigneBonCaisseDto } from './ligne-bon-caisse.dto';

export class CreateBonCaisseDto {
  @IsString()
  reference!: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  annexeId!: string;

  // Le front (bons-slice.ts::addBonSortieCaisse) envoie encore ces deux
  // champs, mais le service les recalcule/impose toujours lui-même
  // (montantTotal = somme des lignes, creePar = user.nom du JWT) — jamais
  // les valeurs client.
  @IsOptional()
  montantTotal?: number;

  @IsString()
  @IsOptional()
  creePar?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneBonCaisseDto)
  lignes!: LigneBonCaisseDto[];
}
