/**
 * Module Supabase Admin supprimé.
 * L'application utilise désormais NestJS + MySQL via api-client.ts.
 * Ce fichier est conservé pour éviter des erreurs d'import dans d'anciens modules.
 */

export function createAdminClient(): never {
  throw new Error(
    "[createAdminClient] Supabase a été supprimé. Utilisez api-client.ts (NestJS/MySQL) à la place.",
  );
}
