import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUserType } from '../../auth/auth.types';

/** Injecte l'utilisateur courant validé par JwtStrategy */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserType }>();
    return request.user;
  },
);

/** Décorateur de métadonnées pour les permissions requises */
import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Décorateur pour les rôles requis */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Marque une route comme publique — le JwtAuthGuard global la laisse passer
 * sans token (login/refresh/logout, suivi public de dossier).
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Exempte une route du CSRFGuard (double-submit). Distinct de @Public() :
 * /auth/refresh et /auth/logout sont @Public() (aucun access token requis)
 * mais reposent sur le cookie de refresh ambiant, donc restent protégés par
 * CSRF — seul /auth/login n'autorise rien sur la base d'un cookie existant
 * (il en établit un nouveau après vérification du mot de passe) et peut
 * légitimement s'en passer.
 */
export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
