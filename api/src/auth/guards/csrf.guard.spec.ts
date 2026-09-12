import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { CSRF_COOKIE } from '../cookie.config';

function contextFor(
  method: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
  skipCsrf = false,
): ExecutionContext {
  const request = { method, cookies, headers };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => (skipCsrf ? { __skip: true } : {}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  function makeGuard(skipCsrf: boolean) {
    const reflector = { getAllAndOverride: () => skipCsrf } as unknown as Reflector;
    return new CsrfGuard(reflector);
  }

  it('laisse passer les méthodes sûres (GET/HEAD/OPTIONS) sans vérifier quoi que ce soit', () => {
    const guard = makeGuard(false);
    expect(guard.canActivate(contextFor('GET'))).toBe(true);
    expect(guard.canActivate(contextFor('HEAD'))).toBe(true);
    expect(guard.canActivate(contextFor('OPTIONS'))).toBe(true);
  });

  it('laisse passer une route @SkipCsrf() (ex. login) sans cookie ni en-tête', () => {
    const guard = makeGuard(true);
    expect(guard.canActivate(contextFor('POST'))).toBe(true);
  });

  it('rejette une requête POST sans cookie ni en-tête CSRF', () => {
    const guard = makeGuard(false);
    expect(() => guard.canActivate(contextFor('POST'))).toThrow();
  });

  it('rejette quand le cookie et l’en-tête ne correspondent pas', () => {
    const guard = makeGuard(false);
    const ctx = contextFor('POST', { [CSRF_COOKIE]: 'abc' }, { 'x-csrf-token': 'def' });
    expect(() => guard.canActivate(ctx)).toThrow();
  });

  it('accepte quand le cookie et l’en-tête correspondent', () => {
    const guard = makeGuard(false);
    const ctx = contextFor('POST', { [CSRF_COOKIE]: 'abc' }, { 'x-csrf-token': 'abc' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
