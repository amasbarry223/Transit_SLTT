import { describe, expect, it, vi } from "vitest";
import { fetchAllPaged, FETCH_PAGE_SIZE } from "@/lib/store/fetch-pages";

describe("fetchAllPaged", () => {
  it("agrège plusieurs pages jusqu'à épuisement", async () => {
    const pages = [
      Array.from({ length: FETCH_PAGE_SIZE }, (_, i) => ({ id: i })),
      [{ id: FETCH_PAGE_SIZE }],
    ];
    let call = 0;
    const buildQuery = () => ({
      range: async () => {
        const data = pages[call++] ?? [];
        return { data, error: null };
      },
    });

    const { data, truncated, error } = await fetchAllPaged<{ id: number }>(buildQuery);
    expect(error).toBeNull();
    expect(truncated).toBe(false);
    expect(data).toHaveLength(FETCH_PAGE_SIZE + 1);
  });

  it("respecte le softCap et marque truncated", async () => {
    const buildQuery = () => ({
      range: async (from: number, to: number) => {
        const size = to - from + 1;
        return {
          data: Array.from({ length: size }, (_, i) => ({ id: from + i })),
          error: null,
        };
      },
    });

    const { data, truncated } = await fetchAllPaged(buildQuery, {
      softCap: 50,
      pageSize: 20,
    });
    expect(data).toHaveLength(50);
    expect(truncated).toBe(true);
  });

  it("propage l'erreur sans perdre le tampon déjà lu", async () => {
    let call = 0;
    const buildQuery = () => ({
      range: async () => {
        call += 1;
        if (call === 1) {
          return { data: [{ id: 1 }], error: null };
        }
        return { data: null, error: { message: "timeout" } };
      },
    });

    const { data, error } = await fetchAllPaged(buildQuery, { pageSize: 1, softCap: 10 });
    expect(data).toEqual([{ id: 1 }]);
    expect(error?.message).toBe("timeout");
  });
});
