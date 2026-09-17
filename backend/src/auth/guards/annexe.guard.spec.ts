import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AnnexeGuard } from './annexe.guard';
import type { CurrentUserType } from '../auth.types';

function contextFor(
  user: CurrentUserType | undefined,
  params: Record<string, string> = {},
  body: Record<string, unknown> = {},
  query: Record<string, string> = {},
): ExecutionContext {
  const request = { user, params, body, query };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function user(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'u1', email: 'u@x.com', nom: 'U', role: 'TRANSITAIRE', permissions: [], annexeIds: ['annexe-ml'], ...overrides };
}

describe('AnnexeGuard', () => {
  const guard = new AnnexeGuard();

  it('rejette une requête non authentifiée', () => {
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });

  it('laisse toujours passer un ADMIN, quelle que soit l’annexe ciblée', () => {
    const ctx = contextFor(user({ role: 'ADMIN', annexeIds: [] }), { annexeId: 'annexe-ci' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('laisse passer un non-admin quand aucune annexe n’est ciblée (pas de restriction)', () => {
    expect(guard.canActivate(contextFor(user()))).toBe(true);
  });

  it('autorise un non-admin ciblant une annexe de son périmètre', () => {
    const ctx = contextFor(user({ annexeIds: ['annexe-ml'] }), { annexeId: 'annexe-ml' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejette un non-admin ciblant une annexe hors de son périmètre', () => {
    const ctx = contextFor(user({ annexeIds: ['annexe-ml'] }), { annexeId: 'annexe-ci' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('cherche annexeId dans params, puis body, puis query (dans cet ordre)', () => {
    const fromBody = contextFor(user({ annexeIds: ['annexe-ml'] }), {}, { annexeId: 'annexe-ci' });
    expect(() => guard.canActivate(fromBody)).toThrow(ForbiddenException);

    const fromQuery = contextFor(user({ annexeIds: ['annexe-ml'] }), {}, {}, { annexeId: 'annexe-ci' });
    expect(() => guard.canActivate(fromQuery)).toThrow(ForbiddenException);
  });
});
