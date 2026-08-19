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
  type SecondaryFetchKey,
} from "@/lib/store/data-fetch";

/**
 * Tables Postgres écoutées en realtime (voir use-supabase-realtime.ts) qui
 * font partie du groupe "core" (les 8 requêtes de fetchCoreEntities, toujours
 * rechargées ensemble — pas de découpage par clé pour ce groupe).
 */
const CORE_REALTIME_TABLES = new Set([
  "clients",
  "dossiers",
  "ecritures",
  "factures",
  "profiles",
  "societes",
]);

/** Tables realtime -> clé de fetch secondaire correspondante (voir SECONDARY_FETCH_KEYS). */
const SECONDARY_REALTIME_TABLE_KEYS: Partial<Record<string, SecondaryFetchKey>> = {
  stock_items: "stock",
  mouvements: "mouvements",
  bons_sortie: "bons",
  bons_sortie_caisse: "bonsSortieCaisse",
  devis: "devis",
  contrats: "contrats",
  depenses: "depenses",
  contrat_prestations: "contratPrestations",
};

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
  /**
   * Refetch scopé à un ensemble de tables Postgres modifiées (déclenché par
   * useSupabaseRealtime) : ne recharge que le groupe core et/ou les clés
   * secondaires concernées, au lieu des 31 tables à chaque écriture.
   */
  refetchTables: (tables: string[]) => Promise<void>;
}

export const createDataFetchSlice: StateCreator<SLTTState, [], [], DataFetchSlice> = (set, get) => {
  // Un fetch complet retraverse 31 tables : si un refetch manuel et le debounce
  // realtime se déclenchent en même temps, on réutilise la requête déjà en vol
  // au lieu de lancer un second fetch complet en parallèle (races sur les set()).
  let inFlightFetch: Promise<void> | null = null;

  const fetchProfilesPublic = async (): Promise<ProfilePublicRow[] | null> => {
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
  };

  /** Recharge le groupe core (8 requêtes) et applique le résultat au store. Renvoie `truncated`. */
  const runFetchCore = async (): Promise<boolean> => {
    const [coreResults, profilesPublic] = await Promise.all([
      fetchCoreEntities(supabase),
      fetchProfilesPublic(),
    ]);
    const truncated = coreResults.some((result) => result.truncated);
    set((state) => ({
      ...state,
      ...mapCoreFetchResults(coreResults, profilesPublic, state),
    }));
    return truncated;
  };

  /**
   * Recharge les clés secondaires demandées (ou toutes si `keys` omis) et
   * applique le résultat au store. Renvoie les échecs et si une liste a été
   * plafonnée, pour construire le message d'avertissement.
   */
  const runFetchSecondary = async (keys?: SecondaryFetchKey[]) => {
    const allSpecs = buildSecondaryFetchSpecs(supabase);
    const specs = keys ? allSpecs.filter((spec) => keys.includes(spec.key)) : allSpecs;
    if (specs.length === 0) {
      return { failed: [] as Awaited<ReturnType<typeof fetchSecondaryEntities>>, truncated: false };
    }
    const secondaryResults = await fetchSecondaryEntities(specs);
    const failed = secondaryResults.filter((result) => result.error);
    const truncated = secondaryResults.some((result) => result.truncated && !result.error);
    set((state) => ({
      ...state,
      ...mapSecondaryFetchResults(secondaryResults, state),
    }));
    return { failed, truncated };
  };

  // `resetWhenClean` : un refetch scopé (realtime, quelques tables) n'a pas
  // une vue complète des 23 clés secondaires — il ne doit jamais effacer un
  // avertissement posé par un fetch précédent sur une clé qu'il n'a pas
  // revérifiée. Seul le fetch complet (chargement initial / refetch manuel)
  // a l'autorité pour repasser l'avertissement à null.
  const applyLoadOutcome = (
    failed: { key: string; error: unknown }[],
    anyTruncated: boolean,
    resetWhenClean: boolean,
  ) => {
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
    } else if (resetWhenClean) {
      set({ partialLoadWarning: null });
    }
  };

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

      // Core et secondaire ne dépendent pas l'un de l'autre : lancés en
      // parallèle plutôt qu'en 2 vagues séquentielles pour diviser le temps
      // de chargement par ~2.
      const [coreTruncated, secondaryOutcome] = await Promise.all([
        runFetchCore(),
        runFetchSecondary(),
      ]);

      applyLoadOutcome(secondaryOutcome.failed, coreTruncated || secondaryOutcome.truncated, true);
      set({ dataLoading: false, lastSyncedAt: Date.now() });
    } catch (error) {
      const message = mapErrorToUserMessage(error, UI.errors.loadData);
      logError("[SLTT] Erreur de chargement Supabase", error);
      set({ loadError: message, dataLoading: false });
    }
  };

  const runFetchScoped = async (tables: string[]) => {
    const needsCore = tables.some((t) => CORE_REALTIME_TABLES.has(t));
    const secondaryKeys = Array.from(
      new Set(
        tables
          .map((t) => SECONDARY_REALTIME_TABLE_KEYS[t])
          .filter((key): key is SecondaryFetchKey => Boolean(key)),
      ),
    );
    if (!needsCore && secondaryKeys.length === 0) return;

    set({ dataLoading: true, loadError: null });
    try {
      const [coreTruncated, secondaryOutcome] = await Promise.all([
        needsCore ? runFetchCore() : Promise.resolve(false),
        secondaryKeys.length > 0
          ? runFetchSecondary(secondaryKeys)
          : Promise.resolve({ failed: [] as Awaited<ReturnType<typeof fetchSecondaryEntities>>, truncated: false }),
      ]);
      applyLoadOutcome(secondaryOutcome.failed, coreTruncated || secondaryOutcome.truncated, false);
      set({ dataLoading: false, lastSyncedAt: Date.now() });
    } catch (error) {
      const message = mapErrorToUserMessage(error, UI.errors.loadData);
      logError("[SLTT] Erreur de synchronisation Supabase", error);
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

    refetchTables: async (tables: string[]) => {
      // Un fetch complet est déjà en vol (chargement initial ou refetch manuel) :
      // il couvre forcément les tables demandées, inutile de le dupliquer.
      if (inFlightFetch) {
        await inFlightFetch;
        return;
      }
      await runFetchScoped(tables);
    },
  };
};
