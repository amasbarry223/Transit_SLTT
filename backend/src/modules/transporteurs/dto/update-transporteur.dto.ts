import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTransporteurDto {
  @IsString()
  @IsOptional()
  nom?: string;

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
  vehicule?: string;

  @IsString()
  @IsOptional()
  immatriculation?: string;

  @IsString()
  @IsOptional()
  trajet?: string;

  @IsNumber()
  @IsOptional()
  capacite?: number;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  annexeId?: string;
}
