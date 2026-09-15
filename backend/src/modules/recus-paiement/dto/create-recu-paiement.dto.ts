import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRecuPaiementDto {
  @IsString()
  annexeId!: string;

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

  // Le front (recus-paiement-slice.ts) envoie encore ce champ, mais le
  // service impose toujours `user.nom` (JWT) comme auteur.
  @IsString()
  @IsOptional()
  creePar?: string;
}
