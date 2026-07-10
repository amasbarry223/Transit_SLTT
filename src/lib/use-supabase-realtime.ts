"use client";

import { useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useStore } from "@/lib/store";

const REALTIME_TABLES = [
  "dossiers",
  "ecritures",
  "factures",
  "clients",
  "stock_items",
  "bons_sortie",
  "devis",
  "profiles",
] as const;

const DEBOUNCE_MS = 800;

/**
 * Écoute les changements Postgres Supabase Realtime et recharge le store (debouncé).
 * Monté une fois dans AppRootInner quand l'utilisateur est authentifié.
 */
export function useSupabaseRealtime(isAuthenticated: boolean) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated) return;

    const channel = supabase.channel("sltt-sync");

    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            void useStore.getState().refetchData();
          }, DEBOUNCE_MS);
        },
      );
    }

    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);
}
