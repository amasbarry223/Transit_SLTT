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
