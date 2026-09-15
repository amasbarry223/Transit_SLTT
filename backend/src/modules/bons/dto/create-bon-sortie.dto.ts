import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBonSortieDto {
  @IsString()
  reference!: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  clientId!: string;

  @IsString()
  @IsOptional()
  clientNom?: string;

  @IsString()
  annexeId!: string;

  @IsString()
  @IsOptional()
  stockId?: string;

  @IsString()
  marchandise!: string;

  @IsNumber()
  quantite!: number;

  @IsString()
  @IsOptional()
  unite?: string;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsNumber()
  @IsOptional()
  montant?: number;

  @IsString()
  @IsOptional()
  statut?: string;
}
