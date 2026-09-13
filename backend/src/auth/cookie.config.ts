import ms from 'ms';
import { jwtAccessExpiresIn, jwtRefreshExpiresIn } from './jwt.config';

export const ACCESS_TOKEN_COOKIE = 'transit_sltt_at';
export const REFRESH_TOKEN_COOKIE = 'transit_sltt_rt';
export const CSRF_COOKIE = 'transit_sltt_csrf';

/**
 * `sameSite`/`domain` dépendent d'une topologie de déploiement (front/API
 * sur le même domaine racine ou non) que ce dépôt ne fige pas — configurables
 * par env plutôt que codés en dur, avec un défaut ('lax', pas de domain) qui
 * fonctionne pour le cas le plus courant (sous-domaines partagés ou même
 * origine en dev). Le CSRF double-submit (voir csrf.guard.ts) reste actif
 * dans tous les cas, indépendamment de ce choix.
 */
function sameSite(): 'lax' | 'strict' | 'none' {
  const value = process.env.COOKIE_SAME_SITE?.toLowerCase();
  if (value === 'strict' || value === 'none') return value;
  return 'lax';
}

function domain(): string | undefined {
  return process.env.COOKIE_DOMAIN || undefined;
}

const isProd = process.env.NODE_ENV === 'production';

function baseOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSite(),
    domain: domain(),
  };
}

/** Options utilisées pour poser ET pour effacer le cookie d'access token —
 *  clearCookie() n'efface rien si ses options ne correspondent pas exactement
 *  à celles utilisées lors de la pose (path/domain notamment). */
export function accessCookieOptions() {
  return { ...baseOptions(), path: '/' };
}

export function accessCookieMaxAge(): number {
  return ms(jwtAccessExpiresIn() as ms.StringValue);
}

/** Path étroit : ce cookie ne part que vers /api/auth/*, jamais vers le
 *  reste de l'API — réduit son exposition à une éventuelle fuite/replay. */
export function refreshCookieOptions(apiPrefix: string) {
  return { ...baseOptions(), path: `/${apiPrefix}/auth` };
}

export function refreshCookieMaxAge(): number {
  return ms(jwtRefreshExpiresIn() as ms.StringValue);
}

/** Non-httpOnly : le front doit pouvoir le lire pour l'échoter en en-tête
 *  X-CSRF-Token (double-submit, voir csrf.guard.ts). */
export function csrfCookieOptions() {
  return { ...baseOptions(), httpOnly: false, path: '/' };
}
