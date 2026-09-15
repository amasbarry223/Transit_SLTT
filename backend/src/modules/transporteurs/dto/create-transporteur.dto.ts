import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTransporteurDto {
  @IsString()
  nom!: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  telephone!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  vehicule!: string;

  @IsString()
  immatriculation!: string;

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
  dateCreation?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  annexeId?: string;
}
