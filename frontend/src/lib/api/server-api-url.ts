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
export function resolveServerApiUrl(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal) return internal;

  const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (pub && !pub.startsWith('/')) return pub;

  return 'http://localhost:3001/api';
}
