/**
 * Utilitaires de pagination — compatibles avec des résultats génériques (NestJS/MySQL).
 * Le module Supabase a été supprimé. Les fonctions pagedSelect/fetchAllPaged qui
 * dépendaient de SupabaseClient sont remplacées par des helpers sans dépendance externe.
 */

export const FETCH_PAGE_SIZE = 500;

/** Tables volumineuses : on plafonne le volume client. */
export const FETCH_SOFT_CAPS: Record<string, number> = {
  audit_logs: 2_000,
  documents: 1_000,
  document_versions: 2_000,
  ocr_jobs: 500,
  ocr_fields: 2_000,
  mouvements: 2_000,
};

const TRANSIENT_FETCH_RE = /failed to fetch|networkerror|load failed|fetch aborted|abort/i;

export function isTransientFetchError(message: string): boolean {
  return TRANSIENT_FETCH_RE.test(message);
}

export function toFetchError(message: string): Error {
  if (isTransientFetchError(message)) {
    return new Error(
      "Connexion au serveur interrompue. Vérifiez le réseau et réessayez.",
    );
  }
  return new Error(message);
}
