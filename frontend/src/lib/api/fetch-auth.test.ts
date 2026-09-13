import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchWithAuth } = await import("@/lib/api/fetch-auth");

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
});

describe("fetchWithAuth", () => {
  it("envoie les cookies de session (credentials: include) — les tokens vivent en cookies httpOnly, plus en en-tête Authorization", async () => {
    await fetchWithAuth("/api/export/excel", { method: "POST", body: "{}" });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.credentials).toBe("include");
    expect(new Headers(init?.headers).get("Authorization")).toBeNull();
  });

  it("ajoute Content-Type application/json par défaut", async () => {
    await fetchWithAuth("/api/test", { method: "GET" });

    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });
});
