import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * DTO de création d'un client. `type` reste une chaîne libre (pas un enum
 * class-validator) car ClientsService.normalizeTypeClient() accepte
 * plusieurs graphies (FR "Entreprise"/"Particulier" depuis le formulaire,
 * enum Prisma "ENTREPRISE"/"PARTICULIER"/"ONG"/"GOUVERNEMENT"/"ETAT" depuis
 * un import) — contraindre ici casserait cette tolérance déjà exploitée.
 */
export class CreateClientDto {
  @IsString()
  @MinLength(1)
  nom!: string;

  @IsString()
  @IsOptional()
  type?: string;

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
  ville?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsString()
  @IsOptional()
  rccm?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  code?: string;

  /** Annexe (Mali/Côte d'Ivoire) — répertoire partagé entre annexes, champ optionnel. */
  @IsString()
  @IsOptional()
  annexeId?: string;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
