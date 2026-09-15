import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

enum CategorieDepenseDto {
  DOUANE = 'DOUANE',
  PORT = 'PORT',
  TRANSPORT = 'TRANSPORT',
  MANUTENTION = 'MANUTENTION',
  ASSURANCE = 'ASSURANCE',
  DIVERS = 'DIVERS',
}

export class CreateDepenseDto {
  @IsString()
  numero!: string;

  @IsString()
  annexeId!: string;

  @IsString()
  @IsOptional()
  dossierId?: string;

  @IsString()
  @IsOptional()
  fournisseurId?: string;

  @IsEnum(CategorieDepenseDto)
  @IsOptional()
  categorie?: CategorieDepenseDto;

  @IsNumber()
  montant!: number;

  @IsString()
  @IsOptional()
  devise?: string;

  @IsString()
  @IsOptional()
  justificatif?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dateDepense?: string;
}
