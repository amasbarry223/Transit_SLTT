import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRecuPaiementDto {
  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  prenom?: string;

  @IsNumber()
  @IsOptional()
  somme?: number;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsNumber()
  @IsOptional()
  montantPaye?: number;
}
