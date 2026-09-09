/**
 * Fetch des entités secondaires — Supabase supprimé.
 * Les données sont désormais chargées via l'API NestJS dans data-fetch-slice.ts.
 * Ce fichier est conservé pour maintenir la compatibilité des imports existants.
 */

export const SECONDARY_FETCH_KEYS = [
  "stock",
  "mouvements",
  "bons",
  "subDossiers",
  "fichiers",
  "devis",
  "transporteurs",
  "fournisseurs",
  "dossierFournisseurs",
  "contrats",
  "contratFichiers",
  "depenses",
  "contratPrestations",
  "bonsSortieCaisse",
  "operationsComptables",
  "cloturesCaisse",
  "recusPaiement",
  "auditLogs",
  "archives",
  "documents",
  "documentVersions",
  "ocrJobs",
  "ocrFields",
] as const;

export type SecondaryFetchKey = (typeof SECONDARY_FETCH_KEYS)[number];

export type SecondaryFetchSpec = {
  key: SecondaryFetchKey;
  q: () => Promise<{ data: unknown[]; truncated: boolean; error: Error | null }>;
};

export type SecondaryFetchResult = {
  key: SecondaryFetchKey;
  data: unknown[] | null;
  error: unknown;
  truncated: boolean;
};

/**
 * @deprecated Utilisez api-client.ts (NestJS) via data-fetch-slice.ts.
 */
export function buildSecondaryFetchSpecs(): SecondaryFetchSpec[] {
  console.warn("[buildSecondaryFetchSpecs] Supabase supprimé. Utilisez api-client.ts via data-fetch-slice.ts.");
  return [];
}

/**
 * @deprecated Utilisez api-client.ts (NestJS) via data-fetch-slice.ts.
 */
export async function fetchSecondaryEntities(
  specs: SecondaryFetchSpec[],
): Promise<SecondaryFetchResult[]> {
  return Promise.all(
    specs.map(async (spec) => {
      try {
        const result = await spec.q();
        return {
          key: spec.key,
          data: result.data,
          error: result.error,
          truncated: result.truncated,
        };
      } catch (error) {
        return {
          key: spec.key,
          data: null,
          error: error instanceof Error ? error : { message: String(error) },
          truncated: false,
        };
      }
    }),
  );
}
