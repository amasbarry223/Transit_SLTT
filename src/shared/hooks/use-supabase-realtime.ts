"use client";

import { useEffect } from "react";

/**
 * Hook de synchronisation temps réel (anciennement Supabase Realtime).
 * Avec NestJS + MySQL, la synchronisation s'effectue via les actions du store
 * et rafraîchissements périodiques/actions de l'utilisateur.
 */
export function useSupabaseRealtime(_isAuthenticated: boolean) {
  useEffect(() => {
    // No-op : suppression de la connexion Supabase Realtime
  }, [_isAuthenticated]);
}
