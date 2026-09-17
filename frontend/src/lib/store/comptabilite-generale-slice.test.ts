import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  comptabilite: {
    createOperation: vi.fn(),
    createCloture: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { ClotureCaisse } from "@/lib/domain-types";

function cloture(overrides: Partial<ClotureCaisse> = {}): ClotureCaisse {
  return {
    id: "cl1",
    entiteType: "annexe",
    annexeId: "annexe-1",
    periodeDebut: "2026-01-01",
    periodeFin: "2026-01-31",
    soldeTheorique: 100000,
    soldeConstate: 100000,
    ecart: 0,
    clotureLe: "2026-02-01T00:00:00.000Z",
    ...overrides,
  } as ClotureCaisse;
}

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({ operationsComptables: [], cloturesCaisse: [], operationComptableSeq: 1, auditLogs: [], auditSeq: 1 });
});

describe("addOperationComptable — validation", () => {
  it("rejette un montant nul ou négatif, sans appeler l’API", async () => {
    await expect(
      useStore.getState().addOperationComptable({
        entiteType: "annexe",
        annexeId: "annexe-1",
        date: "2026-01-01",
        clientNom: "Client A",
        nature: "Test",
        type: "Entrée",
        montant: 0,
      }),
    ).rejects.toThrow(/supérieur à 0/);
    await expect(
      useStore.getState().addOperationComptable({
        entiteType: "annexe",
        annexeId: "annexe-1",
        date: "2026-01-01",
        clientNom: "Client A",
        nature: "Test",
        type: "Entrée",
        montant: -10,
      }),
    ).rejects.toThrow(/supérieur à 0/);
    expect(mockApi.comptabilite.createOperation).not.toHaveBeenCalled();
  });

  it("accepte un montant positif et persiste via l’API", async () => {
    mockApi.comptabilite.createOperation.mockResolvedValueOnce({ id: "op-1" });

    const created = await useStore.getState().addOperationComptable({
      entiteType: "annexe",
      annexeId: "annexe-1",
      date: "2026-01-01",
      clientNom: "Client A",
      nature: "Encaissement",
      type: "Entrée",
      montant: 5000,
    });

    expect(created.montant).toBe(5000);
    expect(mockApi.comptabilite.createOperation).toHaveBeenCalled();
  });
});

describe("recordClotureCaisse — calcul de l’écart et étiquetage de l’entité", () => {
  it("calcule ecart = soldeConstate - soldeTheorique (positif = excédent constaté)", async () => {
    mockApi.comptabilite.createCloture.mockResolvedValueOnce({ id: "cl-new" });

    const result = await useStore.getState().recordClotureCaisse({
      entiteType: "annexe",
      annexeId: "annexe-1",
      periodeDebut: "2026-01-01",
      periodeFin: "2026-01-31",
      soldeTheorique: 100000,
      soldeConstate: 105000,
    });

    expect(result.ecart).toBe(5000);
  });

  it("calcule un écart négatif (manquant constaté)", async () => {
    mockApi.comptabilite.createCloture.mockResolvedValueOnce({ id: "cl-new" });

    const result = await useStore.getState().recordClotureCaisse({
      entiteType: "annexe",
      annexeId: "annexe-1",
      periodeDebut: "2026-01-01",
      periodeFin: "2026-01-31",
      soldeTheorique: 100000,
      soldeConstate: 95000,
    });

    expect(result.ecart).toBe(-5000);
  });

  it("étiquette la clôture avec le vrai entiteType fourni, pas toujours \"annexe\"", async () => {
    mockApi.comptabilite.createCloture.mockResolvedValueOnce({ id: "cl-new" });

    const result = await useStore.getState().recordClotureCaisse({
      entiteType: "societe",
      annexeId: undefined,
      periodeDebut: "2026-01-01",
      periodeFin: "2026-01-31",
      soldeTheorique: 100000,
      soldeConstate: 100000,
    });

    expect(result.entiteType).toBe("societe");
    expect(useStore.getState().cloturesCaisse[0].entiteType).toBe("societe");
  });

  it("remplace la clôture existante pour la même entité/période au lieu de la dupliquer", async () => {
    useStore.setState({ cloturesCaisse: [cloture({ id: "old", soldeConstate: 90000, ecart: -10000 })] });
    mockApi.comptabilite.createCloture.mockResolvedValueOnce({ id: "cl-new" });

    await useStore.getState().recordClotureCaisse({
      entiteType: "annexe",
      annexeId: "annexe-1",
      periodeDebut: "2026-01-01",
      periodeFin: "2026-01-31",
      soldeTheorique: 100000,
      soldeConstate: 100000,
    });

    const clotures = useStore.getState().cloturesCaisse;
    expect(clotures).toHaveLength(1);
    expect(clotures[0].ecart).toBe(0);
  });

  it("conserve les clôtures d’une autre période ou d’une autre annexe (pas de sur-suppression)", async () => {
    useStore.setState({
      cloturesCaisse: [
        cloture({ id: "autre-periode", periodeFin: "2025-12-31" }),
        cloture({ id: "autre-annexe", annexeId: "annexe-2" }),
      ],
    });
    mockApi.comptabilite.createCloture.mockResolvedValueOnce({ id: "cl-new" });

    await useStore.getState().recordClotureCaisse({
      entiteType: "annexe",
      annexeId: "annexe-1",
      periodeDebut: "2026-01-01",
      periodeFin: "2026-01-31",
      soldeTheorique: 100000,
      soldeConstate: 100000,
    });

    const ids = useStore.getState().cloturesCaisse.map((c) => c.id);
    expect(ids).toContain("autre-periode");
    expect(ids).toContain("autre-annexe");
    expect(ids).toHaveLength(3);
  });
});
