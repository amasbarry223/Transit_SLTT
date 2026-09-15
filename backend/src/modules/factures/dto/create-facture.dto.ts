import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LigneFactureDto } from './ligne-facture.dto';

export class CreateFactureDto {
  @IsString()
  numero!: string;

  @IsString()
  annexeId!: string;

  @IsString()
  clientId!: string;

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
  lignes!: LigneFactureDto[];
}
