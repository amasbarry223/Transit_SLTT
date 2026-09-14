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
export function isAllowedOrigin(originOrReferer: string | undefined, rawAllowedCors?: string): boolean {
  if (!originOrReferer) return false;
  const rawCors = rawAllowedCors ?? process.env.CORS_ORIGIN ?? '';
  const configuredCors = rawCors
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(
    new Set([
      'https://traorelogistique-transit.com',
      'https://www.traorelogistique-transit.com',
      'http://localhost:3000',
      'http://localhost:3001',
      ...configuredCors,
    ]),
  );

  let originToTest = originOrReferer;
  try {
    const parsed = new URL(originOrReferer);
    originToTest = parsed.origin;
  } catch {
    // Si parsing échoue, on compare la valeur brute
  }

  return allowedOrigins.some((allowed) => {
    if (allowed === originToTest) return true;
    const cleanAllowed = allowed.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const cleanOrigin = originToTest.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    return cleanAllowed === cleanOrigin;
  });
}

/**
 * Double-submit CSRF + vérification d'origine autorisée (OWASP Cross-Origin API) :
 * 1. Une requête d'état (POST/PUT/PATCH/DELETE) qui échote dans X-CSRF-Token
 *    le jeton du cookie transit_sltt_csrf est validée (same-origin / proxy).
 * 2. Si le front et l'API sont déployés sur des origines distinctes
 *    (ex. traorelogistique-transit.com -> goldenrod-newt-273291.hostingersite.com),
 *    le cookie posé par le backend n'est pas lisible par document.cookie côté client
 *    par restriction Same-Origin du navigateur. Dans ce cas, la vérification
 *    de l'en-tête Origin / Referer contre la liste blanche CORS_ORIGIN
 *    garantit que la requête provient bien de l'application légitime
 *    (le navigateur interdisant toute falsification de l'en-tête Origin par un tiers).
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

    // 1. Validation double-submit si les deux jetons sont fournis et identiques
    if (cookieToken && headerToken && cookieToken === headerToken) {
      return true;
    }

    // 2. Validation par vérification stricte de l'origine (recommandation OWASP API cross-origin)
    const origin = (request.headers['origin'] || request.headers['referer']) as string | undefined;
    if (origin && isAllowedOrigin(origin)) {
      return true;
    }

    throw new ForbiddenException('Jeton CSRF manquant ou invalide.');
  }
}
