import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { CurrentUserType } from '../auth.types';

/**
 * Guard de scoping par annexe — traduit la RLS policy `has_annexe_access(annexe_id)`.
 *
 * Vérifie que l'annexe_id ciblé (dans params, body ou query) appartient
 * aux annexes accessibles de l'utilisateur courant.
 * L'Administrateur bypass la vérification (accès à toutes les annexes).
 *
 * Usage : appliquer sur les routes qui ciblent une annexe spécifique.
 * Pour les lectures de listes, le filtrage se fait dans le service
 * (WHERE annexe_id IN user.annexeIds).
 */
@Injectable()
export class AnnexeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: CurrentUserType;
      params: Record<string, string>;
      body: Record<string, unknown>;
      query: Record<string, string>;
    }>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Non authentifié');
    if (user.role === 'Administrateur') return true;

    // Cherche l'annexe_id dans params > body > query
    const targetAnnexeId =
      request.params['annexeId'] ??
      (request.body['annexeId'] as string) ??
      request.query['annexeId'];

    if (!targetAnnexeId) return true; // Pas d'annexe ciblée = pas de restriction

    if (!user.annexeIds.includes(targetAnnexeId)) {
      throw new ForbiddenException('Cette annexe est hors de votre périmètre');
    }

    return true;
  }
}
