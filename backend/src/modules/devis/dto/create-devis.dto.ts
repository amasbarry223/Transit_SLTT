import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LigneDevisDto } from './ligne-devis.dto';

export class CreateDevisDto {
  @IsString()
  numero!: string;

  @IsString()
  clientId!: string;

  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsString()
  @IsOptional()
  dossierId?: string;

  @IsString()
  @IsOptional()
  portId?: string;

  @IsString()
  @IsOptional()
  nature?: string;

  @IsDateString()
  @IsOptional()
  dateEmission?: string;

  @IsDateString()
  @IsOptional()
  dateValidite?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneDevisDto)
  lignes!: LigneDevisDto[];
}
