import { describe, expect, it } from "vitest";
import {
  FETCH_PAGE_SIZE,
  FETCH_SOFT_CAPS,
  isTransientFetchError,
  toFetchError,
} from "@/lib/store/fetch-pages";

describe("fetch-pages utils", () => {
  it("définit la taille de page par défaut", () => {
    expect(FETCH_PAGE_SIZE).toBe(500);
  });

  it("définit les limites douces (soft caps) pour les tables volumineuses", () => {
    expect(FETCH_SOFT_CAPS.audit_logs).toBe(2_000);
    expect(FETCH_SOFT_CAPS.documents).toBe(1_000);
  });

  it("détecte les erreurs réseau transitoires", () => {
    expect(isTransientFetchError("Failed to fetch")).toBe(true);
    expect(isTransientFetchError("TypeError: NetworkError when attempting to fetch")).toBe(true);
    expect(isTransientFetchError("The user aborted a request.")).toBe(true);
    expect(isTransientFetchError("Invalid credentials")).toBe(false);
  });

  it("convertit les erreurs transitoires en message convivial", () => {
    const err = toFetchError("Failed to fetch");
    expect(err.message).toContain("Connexion au serveur interrompue");

    const regularErr = toFetchError("Dossier introuvable");
    expect(regularErr.message).toBe("Dossier introuvable");
  });
});
