import ms from 'ms';
import { jwtAccessExpiresIn, jwtRefreshExpiresIn } from './jwt.config';

export const ACCESS_TOKEN_COOKIE = 'transit_sltt_at';
export const REFRESH_TOKEN_COOKIE = 'transit_sltt_rt';
export const CSRF_COOKIE = 'transit_sltt_csrf';

const isProd = process.env.NODE_ENV === 'production';

/**
 * `sameSite`/`domain` dépendent d'une topologie de déploiement (front/API
 * sur le même domaine racine ou non) que ce dépôt ne fige pas — configurables
 * par env plutôt que codés en dur. Le CSRF double-submit (voir csrf.guard.ts)
 * reste actif dans tous les cas, indépendamment de ce choix.
 *
 * Défaut par environnement (quand COOKIE_SAME_SITE n'est pas posée) :
 *  - hors production : 'lax' — fonctionne en dev (même "site" localhost) et
 *    ne nécessite pas HTTPS (indispensable : 'none' y échouerait, voir
 *    baseOptions()).
 *  - en production : 'none' — un cookie SameSite=None est envoyé dans TOUS
 *    les cas (same-site ET cross-site), donc ce choix reste correct que le
 *    rewrite proxy Next.js soit effectivement engagé ou non. Avant ce
 *    correctif, le défaut était 'lax' même en production : si le proxy
 *    n'était pas actif (front et API réellement cross-origin du point de vue
 *    du navigateur), le cookie posé au login n'était jamais renvoyé par le
 *    navigateur sur la requête suivante — l'utilisateur se voyait déconnecté
 *    ("session expirée") immédiatement après une connexion pourtant réussie.
 */
function sameSite(): 'lax' | 'strict' | 'none' {
  // .trim() indispensable : une valeur saisie dans un panel d'hébergement
  // (Hostinger…) peut porter un espace de tête/fin invisible à la relecture
  // — sans lui, "none " ne correspond à rien et retombe silencieusement sur
  // le défaut au lieu de la valeur explicitement voulue.
  const value = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
  if (value === 'strict' || value === 'none' || value === 'lax') return value;
  return isProd ? 'none' : 'lax';
}

function domain(): string | undefined {
  const d = process.env.COOKIE_DOMAIN?.trim();
  // Ne pas poser de Domain si vide ou si différent du domaine de l'API
  if (!d || d === '' || d === 'undefined') return undefined;
  return d;
}

function baseOptions() {
  const site = sameSite();
  return {
    httpOnly: true,
    // SameSite=None exige l'attribut Secure (sinon le navigateur rejette
    // silencieusement le cookie, spec RFC 6265bis) — indépendant de isProd :
    // un déploiement cross-origin par nature (COOKIE_SAME_SITE=none) tourne
    // toujours en HTTPS, même hors "production" au sens NODE_ENV.
    secure: isProd || site === 'none',
    sameSite: site,
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
