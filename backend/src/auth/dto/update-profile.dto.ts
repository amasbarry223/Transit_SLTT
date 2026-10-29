import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Corps de PATCH /auth/profile (avant : objet non typé, non validé). */
export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide.' })
  @MaxLength(120)
  @IsOptional()
  nom?: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @IsOptional()
  email?: string;
}
