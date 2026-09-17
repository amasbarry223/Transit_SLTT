/**
 * Source unique des origines de confiance (CORS + vérification Origin/Referer
 * du CsrfGuard). Avant ce fichier, la même liste ("traorelogistique-transit.com"
 * + son sous-domaine www) était recopiée indépendamment dans main.ts et dans
 * csrf.guard.ts — deux endroits à garder manuellement synchronisés à chaque
 * changement de domaine, exactement le genre de duplication qui a déjà fait
 * diverger un autre repli d'URL dans ce projet (voir server-api-url.ts).
 */
const DEFAULT_TRUSTED_ORIGINS = [
  'https://traorelogistique-transit.com',
  'https://www.traorelogistique-transit.com',
  'http://localhost:3000',
  'http://localhost:3001',
];

/** Fusionne les origines par défaut avec celles configurées via CORS_ORIGIN (liste séparée par des virgules). */
export function getTrustedOrigins(rawCors: string | undefined = process.env.CORS_ORIGIN): string[] {
  const configured = (rawCors ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_TRUSTED_ORIGINS, ...configured]));
}

/** Compare deux origines en ignorant le sous-domaine "www." et un slash final. */
function normalizeOrigin(origin: string): string {
  return origin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export function isTrustedOrigin(origin: string, allowedOrigins: string[] = getTrustedOrigins()): boolean {
  return allowedOrigins.some(
    (allowed) => allowed === origin || normalizeOrigin(allowed) === normalizeOrigin(origin),
  );
}
