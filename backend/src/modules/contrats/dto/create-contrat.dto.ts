import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateContratDto {
  @IsString()
  reference!: string;

  @IsString()
  annexeId!: string;

  @IsString()
  clientId!: string;

  @IsString()
  objet!: string;

  @IsDateString()
  dateDebut!: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @IsNumber()
  @IsOptional()
  montant?: number;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // Le front (contrats-slice.ts::addContrat) envoie encore ce champ, mais le
  // service impose toujours `user.nom` (JWT) comme auteur.
  @IsString()
  @IsOptional()
  creePar?: string;
}
