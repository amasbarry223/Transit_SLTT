import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  contrats: {
    update: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { Contrat } from "@/lib/store";

function contrat(overrides: Partial<Contrat> = {}): Contrat {
  return {
    id: "ct1",
    reference: "CTR-2026-0001",
    clientId: "c1",
    clientNom: "Client A",
    annexeId: "annexe-1",
    objet: "Transit annuel",
    dateDebut: "2026-01-01",
    montant: 1000000,
    statut: "En cours",
    nbPrestations: 0,
    nbPrestationsRealisees: 0,
    totalDepenses: 0,
    creePar: "Test",
    creeLe: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Contrat;
}

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({ contrats: [contrat()], depenses: [], contratPrestations: [], annexes: [], auditLogs: [], auditSeq: 1 });
});

describe("updateContrat — garde-fou de transition de statut", () => {
  it("rejette En cours -> Suspendu (absent de CONTRAT_ALLOWED_TRANSITIONS) sans appeler l’API", async () => {
    await expect(
      useStore.getState().updateContrat("ct1", {
        clientId: "c1",
        clientNom: "Client A",
        objet: "Transit annuel",
        dateDebut: "2026-01-01",
        montant: 1000000,
        statut: "Suspendu",
      }),
    ).rejects.toThrow(/Transition contrat invalide/);
    expect(mockApi.contrats.update).not.toHaveBeenCalled();
  });

  it("autorise une transition valide (En cours -> Exécuté) et appelle l’API", async () => {
    mockApi.contrats.update.mockResolvedValueOnce({});

    await useStore.getState().updateContrat("ct1", {
      clientId: "c1",
      clientNom: "Client A",
      objet: "Transit annuel",
      dateDebut: "2026-01-01",
      montant: 1000000,
      statut: "Exécuté",
    });

    expect(mockApi.contrats.update).toHaveBeenCalled();
    expect(useStore.getState().contrats[0].statut).toBe("Exécuté");
  });

  it("n’exige aucune transition valide quand le statut ne change pas", async () => {
    mockApi.contrats.update.mockResolvedValueOnce({});

    await useStore.getState().updateContrat("ct1", {
      clientId: "c1",
      clientNom: "Client A",
      objet: "Objet modifié",
      dateDebut: "2026-01-01",
      montant: 1000000,
      statut: "En cours",
    });

    expect(mockApi.contrats.update).toHaveBeenCalled();
    expect(useStore.getState().contrats[0].objet).toBe("Objet modifié");
  });
});
