import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SKIP_CSRF_KEY } from '../../shared/decorators';
import { CSRF_COOKIE } from '../cookie.config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF : une requête d'état (POST/PUT/PATCH/DELETE) doit
 * échoter, dans l'en-tête X-CSRF-Token, la même valeur que le cookie
 * transit_sltt_csrf posé au login — un site tiers qui déclenche une requête
 * avec les cookies de la victime ne peut pas lire ce cookie (autre origine)
 * pour le recopier dans l'en-tête.
 *
 * Distinct de @Public() : /auth/refresh et /auth/logout sont publics vis-à-vis
 * du JWT mais reposent sur le cookie de refresh ambiant, donc restent
 * protégés ici. Seul /auth/login (@SkipCsrf()) n'autorise rien sur la base
 * d'un cookie existant.
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
    const headerToken = request.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Jeton CSRF manquant ou invalide.');
    }

    return true;
  }
}
