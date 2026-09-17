import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  bons: {
    createBonSortie: vi.fn(),
    validateBonSortie: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { BonSortie, StockItem } from "@/lib/store";

function stockItem(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: "s1",
    marchandise: "Riz",
    quantite: 10,
    unite: "sac",
    annexeId: "annexe-1",
    annexeNom: "Bamako",
    seuil: 0,
    ...overrides,
  } as StockItem;
}

function bon(overrides: Partial<BonSortie> = {}): BonSortie {
  return {
    id: "b1",
    reference: "BS-2026-0001",
    date: "2026-01-01",
    clientId: "c1",
    clientNom: "Client A",
    annexeId: "annexe-1",
    annexeNom: "Bamako",
    stockId: "s1",
    marchandise: "Riz",
    quantite: 4,
    unite: "sac",
    motif: "Livraison",
    montant: 40000,
    statut: "Brouillon",
    ...overrides,
  } as BonSortie;
}

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({
    bons: [],
    stock: [],
    mouvements: [],
    auditLogs: [],
    auditSeq: 1,
  });
});

describe("validateBon — garde-fous", () => {
  it("retourne false si le bon n’existe pas", async () => {
    await expect(useStore.getState().validateBon("inconnu")).resolves.toBe(false);
  });

  it("retourne false et ne fait rien si le bon est déjà Validé (pas de re-validation)", async () => {
    useStore.setState({ bons: [bon({ statut: "Validé" })] });

    const result = await useStore.getState().validateBon("b1");

    expect(result).toBe(false);
    expect(mockApi.bons.validateBonSortie).not.toHaveBeenCalled();
  });

  it("mono-article : refuse si le stock disponible est insuffisant, sans appeler l’API", async () => {
    useStore.setState({ bons: [bon({ quantite: 20 })], stock: [stockItem({ quantite: 10 })] });

    const result = await useStore.getState().validateBon("b1");

    expect(result).toBe(false);
    expect(mockApi.bons.validateBonSortie).not.toHaveBeenCalled();
  });

  it("mono-article : valide, décrémente le stock et journalise un mouvement de sortie", async () => {
    mockApi.bons.validateBonSortie.mockResolvedValueOnce({});
    useStore.setState({ bons: [bon({ quantite: 4 })], stock: [stockItem({ quantite: 10 })] });

    const result = await useStore.getState().validateBon("b1");

    expect(result).toBe(true);
    expect(useStore.getState().bons[0].statut).toBe("Validé");
    expect(useStore.getState().stock[0].quantite).toBe(6);
    expect(useStore.getState().mouvements).toHaveLength(1);
    expect(useStore.getState().mouvements[0]).toMatchObject({ type: "Sortie", quantite: 4, marchandise: "Riz" });
  });

  it("multi-lignes : agrège les quantités de deux lignes pointant vers le même article de stock", async () => {
    mockApi.bons.validateBonSortie.mockResolvedValueOnce({});
    useStore.setState({
      bons: [
        bon({
          lignes: [
            { id: "l1", stockId: "s1", marchandise: "Riz", quantite: 3, unite: "sac", montant: 30000 },
            { id: "l2", stockId: "s1", marchandise: "Riz", quantite: 4, unite: "sac", montant: 40000 },
          ],
        }),
      ],
      stock: [stockItem({ quantite: 10 })],
    });

    const result = await useStore.getState().validateBon("b1");

    expect(result).toBe(true);
    // 10 - (3 + 4) = 3, pas 10-3 puis 10-4 indépendamment
    expect(useStore.getState().stock[0].quantite).toBe(3);
  });

  it("multi-lignes : refuse si la quantité agrégée dépasse le stock disponible", async () => {
    useStore.setState({
      bons: [
        bon({
          lignes: [
            { id: "l1", stockId: "s1", marchandise: "Riz", quantite: 6, unite: "sac", montant: 30000 },
            { id: "l2", stockId: "s1", marchandise: "Riz", quantite: 6, unite: "sac", montant: 40000 },
          ],
        }),
      ],
      stock: [stockItem({ quantite: 10 })],
    });

    const result = await useStore.getState().validateBon("b1");

    expect(result).toBe(false);
    expect(mockApi.bons.validateBonSortie).not.toHaveBeenCalled();
    expect(useStore.getState().stock[0].quantite).toBe(10);
  });

  it("atteint exactement 0 quand la quantité sortie égale le stock disponible", async () => {
    mockApi.bons.validateBonSortie.mockResolvedValueOnce({});
    useStore.setState({
      bons: [bon({ lignes: [{ id: "l1", stockId: "s1", marchandise: "Riz", quantite: 2, unite: "sac", montant: 0 }] })],
      stock: [stockItem({ quantite: 2 })],
    });

    await useStore.getState().validateBon("b1");

    expect(useStore.getState().stock[0].quantite).toBe(0);
  });
});
