/**
 * Fetch des entités de base — Supabase supprimé.
 * Les données sont désormais chargées via l'API NestJS dans data-fetch-slice.ts.
 * Ce fichier est conservé pour maintenir la compatibilité des imports existants.
 */

export type PagedFetchResult<T = unknown> = {
  data: T[];
  truncated: boolean;
  error: Error | null;
};

/**
 * @deprecated Utilisez api-client.ts (NestJS) via data-fetch-slice.ts.
 */
export async function fetchCoreEntities(): Promise<PagedFetchResult[]> {
  console.warn("[fetchCoreEntities] Supabase supprimé. Utilisez api-client.ts via data-fetch-slice.ts.");
  return [];
}
