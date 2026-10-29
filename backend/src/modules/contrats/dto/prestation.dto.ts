import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export const STATUTS_PRESTATION = ['En attente', 'Exécuté', 'Prévue', 'Réalisée', 'Annulée'] as const;

export class CreatePrestationDto {
  @IsString()
  libelle!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  montant?: number;

  @IsIn(STATUTS_PRESTATION)
  @IsOptional()
  statut?: string;

  @IsString()
  @IsOptional()
  datePrevue?: string;

  @IsString()
  @IsOptional()
  dateRealisation?: string;
}

export class UpdatePrestationDto {
  @IsString()
  @IsOptional()
  libelle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  montant?: number;

  @IsIn(STATUTS_PRESTATION)
  @IsOptional()
  statut?: string;

  @IsString()
  @IsOptional()
  datePrevue?: string;

  @IsString()
  @IsOptional()
  dateRealisation?: string;

  @IsBoolean()
  @IsOptional()
  facturee?: boolean;
}
