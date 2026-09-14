/**
 * Nom du cookie CSRF double-submit. Doit correspondre exactement à
 * CSRF_COOKIE dans backend/src/auth/cookie.config.ts — source unique pour
 * éviter qu'une copie locale ne se désynchronise silencieusement (le header
 * X-CSRF-Token ne serait alors plus jamais envoyé, et toute requête d'état
 * échouerait en 403 sans erreur visible côté appelant).
 */
export const CSRF_COOKIE_NAME = 'transit_sltt_csrf';
