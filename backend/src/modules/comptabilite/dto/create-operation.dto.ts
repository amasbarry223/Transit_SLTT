import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOperationDto {
  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  dossierId?: string;

  @IsString()
  @IsOptional()
  clientNom?: string;

  @IsString()
  nature!: string;

  /** Validé plus strictement dans le service (exactement 'Entrée' ou 'Sortie'). */
  @IsIn(['Entrée', 'Sortie'])
  type!: string;

  @IsNumber()
  montant!: number;

  @IsString()
  @IsOptional()
  modePaiement?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  importRef?: string;

  // Le front (comptabilite-generale-slice.ts) envoie encore ce champ, mais
  // le service ne le lit jamais : l'auteur vient toujours de `user.nom`
  // (JWT), jamais d'un texte libre client. Whitelisté ici pour ne pas
  // rejeter ce payload existant, mais volontairement ignoré côté service.
  @IsString()
  @IsOptional()
  creePar?: string;
}
