import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { CSRF_COOKIE } from '../cookie.config';
import { SKIP_CSRF_KEY, SKIP_CSRF_IF_NO_COOKIE_KEY } from '../../shared/decorators';

function contextFor(
  method: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
): ExecutionContext {
  const request = { method, cookies, headers };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  // Le mock distingue les deux clés de métadonnées plutôt que de renvoyer un
  // seul booléen pour toute demande — indispensable pour tester @SkipCsrf()
  // et @SkipCsrfIfNoCookie() indépendamment l'un de l'autre.
  function makeGuard(flags: { skipCsrf?: boolean; skipIfNoCookie?: boolean } = {}) {
    const reflector = {
      getAllAndOverride: (key: string) => {
        if (key === SKIP_CSRF_KEY) return flags.skipCsrf ?? false;
        if (key === SKIP_CSRF_IF_NO_COOKIE_KEY) return flags.skipIfNoCookie ?? false;
        return false;
      },
    } as unknown as Reflector;
    return new CsrfGuard(reflector);
  }

  it('laisse passer les méthodes sûres (GET/HEAD/OPTIONS) sans vérifier quoi que ce soit', () => {
    const guard = makeGuard();
    expect(guard.canActivate(contextFor('GET'))).toBe(true);
    expect(guard.canActivate(contextFor('HEAD'))).toBe(true);
    expect(guard.canActivate(contextFor('OPTIONS'))).toBe(true);
  });

  it('laisse passer une route @SkipCsrf() (ex. login) sans cookie ni en-tête', () => {
    const guard = makeGuard({ skipCsrf: true });
    expect(guard.canActivate(contextFor('POST'))).toBe(true);
  });

  it('rejette une requête POST sans cookie ni en-tête CSRF', () => {
    const guard = makeGuard();
    expect(() => guard.canActivate(contextFor('POST'))).toThrow();
  });

  it('rejette quand le cookie et l’en-tête ne correspondent pas', () => {
    const guard = makeGuard();
    const ctx = contextFor('POST', { [CSRF_COOKIE]: 'abc' }, { 'x-csrf-token': 'def' });
    expect(() => guard.canActivate(ctx)).toThrow();
  });

  it('accepte quand le cookie et l’en-tête correspondent', () => {
    const guard = makeGuard();
    const ctx = contextFor('POST', { [CSRF_COOKIE]: 'abc' }, { 'x-csrf-token': 'abc' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  describe('@SkipCsrfIfNoCookie() (ex. /auth/refresh)', () => {
    it('laisse passer quand le cookie CSRF est absent — cas de la session à rétablir', () => {
      const guard = makeGuard({ skipIfNoCookie: true });
      expect(guard.canActivate(contextFor('POST'))).toBe(true);
    });

    it('exige quand même le double-submit dès qu’un cookie CSRF existe déjà — empêche un tiers de forcer un refresh en boucle', () => {
      const guard = makeGuard({ skipIfNoCookie: true });
      const ctx = contextFor('POST', { [CSRF_COOKIE]: 'abc' }, {});
      expect(() => guard.canActivate(ctx)).toThrow();
    });

    it('accepte quand le cookie existe et que l’en-tête correspond', () => {
      const guard = makeGuard({ skipIfNoCookie: true });
      const ctx = contextFor('POST', { [CSRF_COOKIE]: 'abc' }, { 'x-csrf-token': 'abc' });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
