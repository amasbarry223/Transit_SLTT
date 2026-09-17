import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  stock: {
    createMouvement: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { StockItem } from "@/lib/store";

function stockItem(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: "s1",
    marchandise: "Riz",
    quantite: 10,
    unite: "sac",
    annexeId: "annexe-1",
    annexeNom: "Bamako",
    seuil: 2,
    ...overrides,
  } as StockItem;
}

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({ stock: [stockItem()], mouvements: [], auditLogs: [], auditSeq: 1 });
});

describe("addStockExit — garde-fou stock négatif", () => {
  it("rejette une sortie supérieure au stock disponible, sans appeler l’API ni muter le stock", async () => {
    await expect(useStore.getState().addStockExit("s1", 15, "Agent")).rejects.toThrow(
      "Quantité supérieure au stock disponible.",
    );
    expect(mockApi.stock.createMouvement).not.toHaveBeenCalled();
    expect(useStore.getState().stock[0].quantite).toBe(10);
  });

  it("autorise une sortie qui vide exactement le stock (égalité, pas de rejet)", async () => {
    mockApi.stock.createMouvement.mockResolvedValueOnce({ id: "m1" });

    await useStore.getState().addStockExit("s1", 10, "Agent");

    expect(useStore.getState().stock[0].quantite).toBe(0);
  });

  it("décrémente le stock et journalise un mouvement Sortie après succès API", async () => {
    mockApi.stock.createMouvement.mockResolvedValueOnce({ id: "m1" });

    await useStore.getState().addStockExit("s1", 4, "Agent", "BS-001", "Livraison");

    expect(useStore.getState().stock[0].quantite).toBe(6);
    expect(useStore.getState().mouvements[0]).toMatchObject({
      type: "Sortie",
      quantite: 4,
      bonRef: "BS-001",
      motif: "Livraison",
    });
  });

  it("ne fait rien silencieusement si l’article de stock n’existe pas", async () => {
    await expect(useStore.getState().addStockExit("inconnu", 1, "Agent")).resolves.toBeUndefined();
    expect(mockApi.stock.createMouvement).not.toHaveBeenCalled();
  });
});

describe("addStockEntry", () => {
  it("incrémente le stock et journalise un mouvement Entrée après succès API", async () => {
    mockApi.stock.createMouvement.mockResolvedValueOnce({ id: "m1" });

    await useStore.getState().addStockEntry("s1", 5, "Agent");

    expect(useStore.getState().stock[0].quantite).toBe(15);
    expect(useStore.getState().mouvements[0]).toMatchObject({ type: "Entrée", quantite: 5 });
  });

  it("ne fait rien silencieusement si l’article de stock n’existe pas", async () => {
    await expect(useStore.getState().addStockEntry("inconnu", 5, "Agent")).resolves.toBeUndefined();
    expect(mockApi.stock.createMouvement).not.toHaveBeenCalled();
  });
});
