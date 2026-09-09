/**
 * Module Supabase Server supprimé.
 * L'application utilise désormais NestJS + MySQL via api-client.ts.
 * Ce fichier est conservé pour éviter des erreurs d'import dans d'anciens modules.
 */

export function createServerClient(_accessToken?: string): never {
  throw new Error(
    "[createServerClient] Supabase a été supprimé. Utilisez api-client.ts (NestJS/MySQL) à la place.",
  );
}
