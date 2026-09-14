/**
 * URL absolue de l'API NestJS pour les appels serveur-à-serveur (route
 * handlers Next.js, helpers d'audit). Distincte de `NEXT_PUBLIC_API_URL` :
 * celle-ci peut être réglée en production sur un chemin relatif ("/api") pour
 * que le navigateur passe par le rewrite proxy de next.config.mjs (cookies
 * same-origin), mais un `fetch()` exécuté côté serveur Next.js n'a pas
 * d'origine implicite — une URL relative y échoue toujours ("Failed to parse
 * URL"). `INTERNAL_API_URL` est donc requis en production dès que
 * NEXT_PUBLIC_API_URL est relatif.
 */
// Doit rester en phase avec le fallback du rewrite dans next.config.mjs.
// Avant ce correctif, ce fichier retombait sur localhost:3001 même en
// production quand INTERNAL_API_URL n'était pas définie, alors que
// next.config.mjs retombait déjà sur la vraie URL Hostinger : un appel
// navigateur (passé par le proxy) atteignait le backend réel pendant qu'un
// appel serveur-à-serveur (route handlers profil/mot de passe/audit)
// tentait silencieusement de joindre localhost en production.
const PROD_FALLBACK_API_URL = 'https://goldenrod-newt-273291.hostingersite.com/api';
const DEV_FALLBACK_API_URL = 'http://localhost:3001/api';

export function resolveServerApiUrl(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal) return internal;

  const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (pub && !pub.startsWith('/')) return pub;

  return process.env.NODE_ENV === 'production' ? PROD_FALLBACK_API_URL : DEV_FALLBACK_API_URL;
}
