import { BadRequestException } from '@nestjs/common';

/**
 * Seuil unique de robustesse des mots de passe, partagé par
 * AuthService.changePassword et UsersService (création/édition/reset) — les
 * deux dupliquaient auparavant un simple contrôle de longueur (>= 8) sans
 * exiger de complexité, moins strict que le schéma déjà défini côté
 * frontend (frontend/src/lib/api/schemas.ts strongPasswordSchema) mais
 * jamais branché sur le vrai formulaire (password-field.tsx n'avait qu'un
 * `minLength={8}`) : un mot de passe comme "aaaaaaaa" passait de bout en bout.
 */
export function assertStrongPassword(
  password: string | undefined,
  label = 'Le mot de passe',
): asserts password is string {
  if (!password || password.length < 8) {
    throw new BadRequestException(`${label} doit contenir au moins 8 caractères.`);
  }
  if (!/[a-z]/.test(password)) {
    throw new BadRequestException(`${label} doit contenir au moins une minuscule.`);
  }
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestException(`${label} doit contenir au moins une majuscule.`);
  }
  if (!/[0-9]/.test(password)) {
    throw new BadRequestException(`${label} doit contenir au moins un chiffre.`);
  }
}
