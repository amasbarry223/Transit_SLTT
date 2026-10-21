import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBonSortieDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientNom?: string;

  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsString()
  @IsOptional()
  stockId?: string;

  @IsString()
  @IsOptional()
  marchandise?: string;

  @IsNumber()
  @IsOptional()
  quantite?: number;

  @IsString()
  @IsOptional()
  unite?: string;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsNumber()
  @IsOptional()
  montant?: number;
}
