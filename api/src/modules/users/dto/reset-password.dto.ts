import { IsOptional, IsString } from 'class-validator';

/** Le proxy Next.js (route /api/admin/users/[id]/password) envoie
 *  "motDePasse" ; d'autres appels directs peuvent envoyer "password" — les
 *  deux sont whitelistés, UsersController choisit `password ?? motDePasse`
 *  et valide la longueur (>= 8) avant d'appeler le service. */
export class ResetPasswordDto {
  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  motDePasse?: string;
}
