import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveServerApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load() {
    return import("./server-api-url");
  }

  it("utilise INTERNAL_API_URL en priorité quand elle est définie", async () => {
    vi.stubEnv("INTERNAL_API_URL", "https://api.exemple.com/api");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");
    const { resolveServerApiUrl } = await load();
    expect(resolveServerApiUrl()).toBe("https://api.exemple.com/api");
  });

  it("retombe sur NEXT_PUBLIC_API_URL si elle est absolue", async () => {
    vi.stubEnv("INTERNAL_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://autre-api.exemple.com/api");
    const { resolveServerApiUrl } = await load();
    expect(resolveServerApiUrl()).toBe("https://autre-api.exemple.com/api");
  });

  it("ignore NEXT_PUBLIC_API_URL si elle est relative (inutilisable pour un fetch() côté serveur)", async () => {
    vi.stubEnv("INTERNAL_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");
    vi.stubEnv("NODE_ENV", "test");
    const { resolveServerApiUrl } = await load();
    expect(resolveServerApiUrl()).toBe("http://localhost:3001/api");
  });

  it("en production sans aucune variable définie, retombe sur la même URL Hostinger que le rewrite de next.config.mjs — pas sur localhost", async () => {
    vi.stubEnv("INTERNAL_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    const { resolveServerApiUrl } = await load();
    expect(resolveServerApiUrl()).toBe("https://goldenrod-newt-273291.hostingersite.com/api");
  });

  it("hors production sans aucune variable définie, retombe sur localhost (dev local)", async () => {
    vi.stubEnv("INTERNAL_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NODE_ENV", "test");
    const { resolveServerApiUrl } = await load();
    expect(resolveServerApiUrl()).toBe("http://localhost:3001/api");
  });
});
