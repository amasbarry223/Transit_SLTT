import { beforeEach, describe, expect, it, vi } from "vitest";

const { authState } = vi.hoisted(() => ({
  authState: {
    accessToken: "tok-fresh" as string | null,
  },
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    getAccessToken: () => authState.accessToken,
  },
}));

const { fetchWithAuth } = await import("@/lib/api/fetch-auth");

beforeEach(() => {
  authState.accessToken = "tok-fresh";
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
  });

  it("n'envoie pas de token Authorization s'il n'y a pas de session", async () => {
    authState.accessToken = null;

    await fetchWithAuth("/api/export/excel", { method: "POST", body: "{}" });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(new Headers(init?.headers).get("Authorization")).toBeNull();
  });

  it("ajoute Content-Type application/json par défaut", async () => {
    await fetchWithAuth("/api/test", { method: "GET" });

    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });
});
