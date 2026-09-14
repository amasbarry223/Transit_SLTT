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
 * Exempte une route du CsrfGuard (double-submit) inconditionnellement.
 * Réservé à /auth/login (aucun cookie CSRF n'existe encore) et /auth/logout
 * (déconnexion volontaire : doit fonctionner même avec un cookie CSRF
 * absent/désynchronisé, pour permettre une réinitialisation de session
 * propre). Pour /auth/refresh, voir @SkipCsrfIfNoCookie() ci-dessous — un
 * skip inconditionnel y rouvrirait un CSRF exploitable sur les sessions qui
 * ont déjà un cookie CSRF valide.
 */
export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

/**
 * Exempte une route du CsrfGuard UNIQUEMENT quand le cookie CSRF est absent
 * de la requête — utilisé par /auth/refresh, qui réémet ce cookie
 * (setCsrfCookie() dans AuthController) pour une session qui en est
 * dépourvue (ouverte avant l'ajout de cette protection, cookie effacé
 * isolément…). Un @SkipCsrf() inconditionnel y créerait un CSRF exploitable
 * sur les sessions qui ont déjà un cookie CSRF valide : dès qu'il existe, le
 * double-submit normal (cookie + en-tête) redevient obligatoire.
 */
export const SKIP_CSRF_IF_NO_COOKIE_KEY = 'skipCsrfIfNoCookie';
export const SkipCsrfIfNoCookie = () => SetMetadata(SKIP_CSRF_IF_NO_COOKIE_KEY, true);
