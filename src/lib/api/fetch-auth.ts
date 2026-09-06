import { api } from "@/lib/api-client";

export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  const accessToken = api.getAccessToken();

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  return response;
}
