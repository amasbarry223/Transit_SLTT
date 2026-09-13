import { IsArray, IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

/**
 * DTO de création d'un utilisateur.
 *
 * Le mot de passe est accepté sous "password" (api-client.ts) ou
 * "motDePasse" (certains appels directs) — les deux champs sont
 * whitelistés séparément plutôt que fusionnés via un `@Transform`, qui se
 * heurterait à `forbidNonWhitelisted` (le champ non consommé par le
 * Transform serait rejeté comme "should not exist"). UsersService.create()
 * choisit `password ?? motDePasse` et rejette (>= 8 caractères, jamais de
 * repli implicite) — auparavant un mot de passe absent retombait sur
 * 'Transit2026!' codé en dur, documenté ici même dans l'historique Git,
 * qui aurait ouvert n'importe quel compte créé sans ce champ.
 */
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  motDePasse?: string;

  @IsString()
  nom!: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  /** Chaîne libre : mapToPrismaRole() tolère plusieurs graphies (FR/enum Prisma). */
  @IsString()
  @IsOptional()
  role?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  annexeIds?: string[];

  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
