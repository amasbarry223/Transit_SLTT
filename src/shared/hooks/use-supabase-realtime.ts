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
  "mouvements",
  "bons_sortie",
  "bons_sortie_caisse",
  "devis",
  "profiles",
  "societes",
  "contrats",
  "depenses",
  "contrat_prestations",
] as const;

const DEBOUNCE_MS = 800;

/**
 * Écoute les changements Postgres Supabase Realtime et recharge le store (debouncé).
 * Monté une fois dans AppRootInner quand l'utilisateur est authentifié.
 */
export function useSupabaseRealtime(isAuthenticated: boolean) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instanceIdRef = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated) return;

    // Nom de topic unique par montage : côté client, `removeChannel()` est
    // asynchrone (attend l'accusé "unsubscribe" du serveur avant de retirer
    // le canal du registre interne). Avec un nom fixe, un effet relancé
    // avant la fin de ce nettoyage récupérerait le même canal déjà souscrit
    // (`supabase.channel()` renvoie l'instance existante par topic) et
    // `.on()` lèverait "cannot add postgres_changes callbacks ... after
    // subscribe()". `AppRoot` étant désormais monté une seule fois (layout
    // racine), cet effet peut se relancer plus vite qu'avant (StrictMode,
    // bascule rapide d'auth) — le nom fixe le rendait vulnérable.
    const channel = supabase.channel(`sltt-sync-${instanceIdRef.current++}`);

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
