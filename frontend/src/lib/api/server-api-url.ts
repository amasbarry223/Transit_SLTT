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
// Repli de prod importé de deployment-config.mjs — source unique partagée
// avec le rewrite de next.config.mjs. Avant ce correctif, ce fichier
// retombait sur localhost:3001 même en production quand INTERNAL_API_URL
// n'était pas définie, alors que next.config.mjs retombait déjà sur la
// vraie URL Hostinger : un appel navigateur (passé par le proxy) atteignait
// le backend réel pendant qu'un appel serveur-à-serveur (route handlers
// profil/mot de passe/audit) tentait silencieusement de joindre localhost
// en production. Les deux valeurs étaient recopiées indépendamment et ont
// fini par diverger — d'où la source commune désormais.
import { PROD_API_FALLBACK_URL } from './deployment-config.mjs';

const DEV_FALLBACK_API_URL = 'http://localhost:3001/api';

export function resolveServerApiUrl(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal) return internal;

  const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (pub && !pub.startsWith('/')) return pub;

  return process.env.NODE_ENV === 'production' ? PROD_API_FALLBACK_URL : DEV_FALLBACK_API_URL;
}
