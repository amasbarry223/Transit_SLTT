import { createClient } from "@supabase/supabase-js";

/** Migration vers NestJS + MySQL : Supabase est désactivé. */
export const isSupabaseConfigured = false;

export const supabase = createClient(
  "http://localhost:3001",
  "placeholder-disabled-token",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
