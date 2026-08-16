import { beforeEach, describe, expect, it, vi } from "vitest";

const { authState } = vi.hoisted(() => ({
  authState: {
    session: {
      access_token: "tok-fresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    } as { access_token: string; expires_at: number } | null,
    refreshResult: {
      session: { access_token: "tok-refreshed", expires_at: Math.floor(Date.now() / 1000) + 3600 },
      error: null as { message: string } | null,
    },
    getSessionCalls: 0,
    refreshCalls: 0,
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => {
        authState.getSessionCalls += 1;
        return { data: { session: authState.session }, error: null };
      },
      refreshSession: async () => {
        authState.refreshCalls += 1;
        return {
          data: { session: authState.refreshResult.session },
          error: authState.refreshResult.error,
        };
      },
    },
  },
}));

const { fetchWithAuth } = await import("@/lib/api/fetch-auth");

beforeEach(() => {
  authState.getSessionCalls = 0;
  authState.refreshCalls = 0;
  authState.session = {
    access_token: "tok-fresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  authState.refreshResult = {
    session: {
      access_token: "tok-refreshed",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
    error: null,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
});

describe("fetchWithAuth", () => {
  it("envoie le bearer token de la session courante", async () => {
    await fetchWithAuth("/api/export/excel", { method: "POST", body: "{}" });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer tok-fresh");
    expect(authState.refreshCalls).toBe(0);
  });

  it("rafraîchit un token proche de l'expiration", async () => {
    authState.session = {
      access_token: "tok-stale",
      expires_at: Math.floor(Date.now() / 1000) + 10,
    };

    await fetchWithAuth("/api/export/excel", { method: "POST", body: "{}" });

    expect(authState.refreshCalls).toBe(1);
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer tok-refreshed");
  });

  it("retente une fois après un 401 avec un token rafraîchi", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "expired" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const res = await fetchWithAuth("/api/export/excel", { method: "POST", body: "{}" });

    expect(res.status).toBe(200);
    expect(authState.refreshCalls).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, retryInit] = fetchMock.mock.calls[1]!;
    expect(new Headers(retryInit?.headers).get("Authorization")).toBe("Bearer tok-refreshed");
  });
});
