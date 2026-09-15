import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Le front envoie parfois un ContratInput complet (édition depuis le
 * formulaire), parfois un objet partiel ({ statut } seul depuis une
 * transition de statut) — tous les champs sont donc optionnels ici, le
 * service applique déjà son propre `if (data.x !== undefined)` champ par
 * champ.
 */
export class UpdateContratDto {
  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  // Le front (ContratInput) envoie ce champ pour son propre cache local ;
  // le service ne le lit jamais (le nom du client vient de la relation Prisma).
  @IsString()
  @IsOptional()
  clientNom?: string;

  @IsString()
  @IsOptional()
  objet?: string;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

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
}
