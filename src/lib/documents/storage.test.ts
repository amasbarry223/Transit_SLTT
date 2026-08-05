import { describe, expect, it, vi } from "vitest";
import { dataUrlToBlob } from "./storage";

describe("dataUrlToBlob", () => {
  it("décode une data: URL base64 sans passer par fetch() (bloqué par la CSP connect-src)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const original = "Bonjour é à ü 中文 🚀";
    const base64 = Buffer.from(original, "utf-8").toString("base64");
    const blob = await dataUrlToBlob(`data:application/pdf;base64,${base64}`);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBe(Buffer.byteLength(original, "utf-8"));
    expect(Buffer.from(await blob.arrayBuffer()).toString("utf-8")).toBe(original);

    fetchSpy.mockRestore();
  });

  it("décode une data: URL non-base64 (texte URL-encodé)", async () => {
    const blob = await dataUrlToBlob("data:text/plain,Hello%20World");
    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("Hello World");
  });

  it("rejette une URL qui n'est pas au format data:", async () => {
    await expect(dataUrlToBlob("https://example.com/fichier.pdf")).rejects.toThrow(
      "URL de données invalide.",
    );
  });
});
