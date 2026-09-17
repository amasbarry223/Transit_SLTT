import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "./data-fetch-slice";

function page(data: number[], totalPages: number) {
  return { data, meta: { totalPages } };
}

describe("fetchAllPages", () => {
  it("agrège toutes les pages en un seul tableau", async () => {
    const fetchPage = vi.fn(({ page: p }: { page: number; limit: number }) => {
      if (p === 1) return Promise.resolve(page([1, 2], 3));
      if (p === 2) return Promise.resolve(page([3, 4], 3));
      return Promise.resolve(page([5], 3));
    });

    const result = await fetchAllPages(fetchPage);

    expect(result.data).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("ne fait qu'un seul appel quand tout tient sur une page", async () => {
    const fetchPage = vi.fn(() => Promise.resolve(page([1, 2], 1)));

    const result = await fetchAllPages(fetchPage);

    expect(result.data).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("dégrade une page en échec au lieu de perdre les pages déjà récupérées", async () => {
    const fetchPage = vi.fn(({ page: p }: { page: number; limit: number }) => {
      if (p === 1) return Promise.resolve(page([1, 2], 3));
      if (p === 2) return Promise.reject(new Error("network blip"));
      return Promise.resolve(page([5], 3));
    });

    const result = await fetchAllPages(fetchPage);

    // La page 1 (déjà en main) et la page 3 (réussie) sont conservées ;
    // seule la page 2, en échec, est absente — pas de perte totale.
    expect(result.data).toEqual([1, 2, 5]);
  });

  it("propage l'échec si la toute première page échoue (rien à agréger)", async () => {
    const fetchPage = vi.fn(() => Promise.reject(new Error("down")));

    await expect(fetchAllPages(fetchPage)).rejects.toThrow("down");
  });
});
