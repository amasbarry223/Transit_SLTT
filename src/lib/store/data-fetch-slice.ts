import type { StateCreator } from "zustand";
import { logError, logWarn } from "@/shared/logger";
import { mapErrorToUserMessage } from "@/lib/error-messages";
import { UI } from "@/lib/ui-messages";
import { supabase } from "@/lib/supabase";
import type { ProfilePublicRow } from "@/lib/db-rows";
import type { SLTTState } from "@/lib/store";
import {
  buildSecondaryFetchSpecs,
  fetchCoreEntities,
  fetchSecondaryEntities,
  mapCoreFetchResults,
  mapSecondaryFetchResults,
} from "@/lib/store/data-fetch";

export interface DataFetchSlice {
  dataLoading: boolean;
  loadError: string | null;
  /** Échec non bloquant d'une des requêtes secondaires. */
  partialLoadWarning: string | null;
  lastSyncedAt: number | null;
  fetchData: () => Promise<void>;
  clearLoadError: () => void;
  clearPartialLoadWarning: () => void;
  refetchData: () => Promise<void>;
}

export const createDataFetchSlice: StateCreator<SLTTState, [], [], DataFetchSlice> = (set, get) => {
  // Un fetch complet retraverse 31 tables : si un refetch manuel et le debounce
  // realtime se déclenchent en même temps, on réutilise la requête déjà en vol
  // au lieu de lancer un second fetch complet en parallèle (races sur les set()).
  let inFlightFetch: Promise<void> | null = null;

  const runFetchData = async () => {
    set({ dataLoading: true, loadError: null, partialLoadWarning: null });
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error("Session Supabase absente. Reconnectez-vous pour charger les données.");
      }

      // Les 3 groupes ci-dessous ne dépendent pas les uns des autres (secondarySpecs
      // ne lit aucun résultat du core) : on les lance en parallèle plutôt qu'en
      // 3 vagues séquentielles pour diviser le temps de chargement par ~2.
      const secondarySpecs = buildSecondaryFetchSpecs(supabase);
      const [coreResults, profilesPublic, secondaryResults] = await Promise.all([
        fetchCoreEntities(supabase),
        (async (): Promise<ProfilePublicRow[] | null> => {
          try {
            // Colonnes lues par mapCoreFetchResults (usersPublic) — voir
            // map-core-fetch-results.ts.
            const { data, error } = await supabase
              .from("profiles_public")
              .select("id, nom, role, actif, derniere_connexion");
            if (error) throw error;
            return data;
          } catch {
            return null;
          }
        })(),
        fetchSecondaryEntities(secondarySpecs),
      ]);
      const coreTruncated = coreResults.some((result) => result.truncated);

      set((state) => ({
        ...state,
        ...mapCoreFetchResults(coreResults, profilesPublic, state),
      }));

      const failed = secondaryResults.filter((result) => result.error);
      const anyTruncated = coreTruncated || secondaryResults.some((result) => result.truncated && !result.error);

      if (failed.length > 0) {
        logWarn("[SLTT] Chargement secondaire partiel", undefined, {
          failures: failed.map((entry) => `${entry.key}: ${(entry.error as { message?: string })?.message || entry.error}`),
        });
        set({
          partialLoadWarning:
            "Certaines données n'ont pas pu être rechargées ; l'affichage conserve le cache précédent pour ces modules.",
        });
      } else if (anyTruncated) {
        set({
          partialLoadWarning:
            "Volume important : certaines listes sont plafonnées côté client. Affinez les filtres ou archivez les anciens enregistrements.",
        });
      } else {
        set({ partialLoadWarning: null });
      }

      set((state) => ({
        ...state,
        ...mapSecondaryFetchResults(secondaryResults, state),
      }));
    } catch (error) {
      const message = mapErrorToUserMessage(error, UI.errors.loadData);
      logError("[SLTT] Erreur de chargement Supabase", error);
      set({ loadError: message, dataLoading: false });
    }
  };

  const fetchData = () => {
    if (inFlightFetch) return inFlightFetch;
    inFlightFetch = runFetchData().finally(() => {
      inFlightFetch = null;
    });
    return inFlightFetch;
  };

  return {
    dataLoading: false,
    loadError: null,
    partialLoadWarning: null,
    lastSyncedAt: null,

    clearLoadError: () => set({ loadError: null }),
    clearPartialLoadWarning: () => set({ partialLoadWarning: null }),

    fetchData,

    refetchData: async () => {
      set({ loadError: null });
      await get().fetchData();
    },
  };
};
