import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveClientApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function load() {
    return import("./api-client");
  }

  it("utilise NEXT_PUBLIC_API_URL en priorité quand elle est définie", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");
    const { resolveClientApiBaseUrl } = await load();
    expect(resolveClientApiBaseUrl()).toBe("/api");
  });

  it("retire un slash final de NEXT_PUBLIC_API_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://exemple.com/api/");
    const { resolveClientApiBaseUrl } = await load();
    expect(resolveClientApiBaseUrl()).toBe("https://exemple.com/api");
  });

  it(
    "côté navigateur en production sans NEXT_PUBLIC_API_URL, retombe sur /api (proxy next.config.mjs) — " +
      "jamais sur localhost, qui pointerait chaque visiteur vers sa propre machine",
    async () => {
      // resolveClientApiBaseUrl() ne bascule sur '/api' que côté navigateur
      // (typeof window !== 'undefined') — l'environnement de test par défaut
      // est 'node' (vitest.config.ts), sans window, d'où ce stub minimal.
      vi.stubGlobal("window", {});
      vi.stubEnv("NEXT_PUBLIC_API_URL", "");
      vi.stubEnv("NODE_ENV", "production");
      const { resolveClientApiBaseUrl } = await load();
      expect(resolveClientApiBaseUrl()).toBe("/api");
    },
  );

  it("hors production sans NEXT_PUBLIC_API_URL, retombe sur localhost (dev local)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "test");
    const { resolveClientApiBaseUrl } = await load();
    expect(resolveClientApiBaseUrl()).toBe("http://localhost:3001/api");
  });

  it("côté serveur (pas de window) même en production, ne bascule PAS sur /api (inutilisable pour un fetch sans origine implicite)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    const { resolveClientApiBaseUrl } = await load();
    expect(resolveClientApiBaseUrl()).toBe("http://localhost:3001/api");
  });
});
