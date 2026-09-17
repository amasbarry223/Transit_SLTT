import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../../shared/decorators';
import type { CurrentUserType } from '../auth.types';

function contextFor(user: CurrentUserType | undefined): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function makeGuard(requiredRoles?: string[]) {
  const reflector = {
    getAllAndOverride: (key: string) => (key === ROLES_KEY ? requiredRoles : undefined),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

function user(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'u1', email: 'u@x.com', nom: 'U', role: 'TRANSITAIRE', permissions: [], annexeIds: [], ...overrides };
}

describe('RolesGuard', () => {
  it('laisse passer si aucun rôle n’est requis (pas de @Roles() sur la route)', () => {
    const guard = makeGuard(undefined);
    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });

  it('laisse passer si @Roles() est un tableau vide', () => {
    const guard = makeGuard([]);
    expect(guard.canActivate(contextFor(user()))).toBe(true);
  });

  it('rejette une requête non authentifiée quand un rôle est requis', () => {
    const guard = makeGuard(['ADMIN']);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });

  it('laisse toujours passer un ADMIN, quel que soit le rôle requis', () => {
    const guard = makeGuard(['COMPTABLE']);
    expect(guard.canActivate(contextFor(user({ role: 'ADMIN' })))).toBe(true);
  });

  it('autorise un utilisateur dont le rôle correspond (insensible à la casse)', () => {
    const guard = makeGuard(['comptable']);
    expect(guard.canActivate(contextFor(user({ role: 'COMPTABLE' })))).toBe(true);
  });

  it('rejette un utilisateur dont le rôle ne correspond à aucun rôle requis', () => {
    const guard = makeGuard(['COMPTABLE']);
    expect(() => guard.canActivate(contextFor(user({ role: 'TRANSITAIRE' })))).toThrow(ForbiddenException);
  });
});
