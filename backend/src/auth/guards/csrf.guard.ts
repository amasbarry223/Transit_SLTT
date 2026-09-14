import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SKIP_CSRF_KEY, SKIP_CSRF_IF_NO_COOKIE_KEY } from '../../shared/decorators';
import { CSRF_COOKIE } from '../cookie.config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF : une requête d'état (POST/PUT/PATCH/DELETE) doit
 * échoter, dans l'en-tête X-CSRF-Token, la même valeur que le cookie
 * transit_sltt_csrf posé au login — un site tiers qui déclenche une requête
 * avec les cookies de la victime ne peut pas lire ce cookie (autre origine)
 * pour le recopier dans l'en-tête.
 *
 * Distinct de @Public() : /auth/login, /auth/refresh et /auth/logout sont
 * publics vis-à-vis du JWT mais restent, par défaut, protégés ici.
 * /auth/login et /auth/logout sont en @SkipCsrf() inconditionnel ; voir
 * shared/decorators/index.ts pour la justification. /auth/refresh est en
 * @SkipCsrfIfNoCookie() : seules les sessions SANS cookie CSRF passent sans
 * vérification (le refresh leur en réémet un — voir setCsrfCookie() dans
 * AuthController) ; dès qu'un cookie CSRF existe, le double-submit normal
 * redevient obligatoire — sans quoi une page tierce pourrait déclencher des
 * refresh à volonté pour un compte déjà connecté (nuisance : épuisement du
 * throttle 10/min sur ce endpoint).
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method)) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const cookieToken = request.cookies?.[CSRF_COOKIE];

    const skipIfNoCookie = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_IF_NO_COOKIE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipIfNoCookie && !cookieToken) return true;

    const headerToken = request.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Jeton CSRF manquant ou invalide.');
    }

    return true;
  }
}
