import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFournisseurDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  rccm?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  // Voir CreateFournisseurDto : champs envoyés par le front mais absents du
  // modèle Prisma / ignorés par le service.
  @IsNumber()
  @IsOptional()
  tarifContractuel?: number;

  @IsString()
  @IsOptional()
  statut?: string;
}
