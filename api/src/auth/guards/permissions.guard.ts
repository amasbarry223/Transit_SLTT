import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../shared/decorators';
import type { CurrentUserType } from '../auth.types';

/**
 * Guard de permissions.
 * L'Administrateur bypass toutes les permissions.
 * Pour les autres rôles, vérifie que la permission est dans user.permissions.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: CurrentUserType }>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Non authentifié');

    // Administrateur / ADMIN = accès total
    if (user.role === 'ADMIN' || user.role === 'Administrateur' || user.permissions?.includes('*')) return true;

    const hasAll = required.every((perm) => user.permissions.includes(perm));
    if (!hasAll) {
      throw new ForbiddenException(`Permission requise : ${required.join(', ')}`);
    }

    return true;
  }
}
