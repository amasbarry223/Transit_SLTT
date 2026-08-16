import { supabase } from "@/lib/supabase";

/** Marge avant expiration pour rafraîchir proactivement le JWT. */
const TOKEN_REFRESH_SKEW_SEC = 60;

async function resolveAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now >= TOKEN_REFRESH_SKEW_SEC) {
    return session.access_token;
  }

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error || !refreshed.session?.access_token) {
    return session.access_token;
  }

  return refreshed.session.access_token;
}

export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  let accessToken = await resolveAccessToken();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 && accessToken) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    const retryToken = refreshed.session?.access_token;
    if (!error && retryToken && retryToken !== accessToken) {
      headers.set("Authorization", `Bearer ${retryToken}`);
      response = await fetch(input, {
        ...init,
        headers,
      });
    }
  }

  return response;
}
