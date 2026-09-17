import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  devis: {
    update: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { Devis } from "@/lib/store";

function devis(overrides: Partial<Devis> = {}): Devis {
  return {
    id: "dv1",
    reference: "DEV-2026-0001",
    clientId: "c1",
    clientNom: "Client A",
    annexeId: "annexe-1",
    nature: "Transit import",
    droitDouane: 100000,
    fraisCircuit: 50000,
    fraisPrestation: 30000,
    total: 180000,
    statut: "Brouillon",
    dateCreation: "2026-01-01",
    dateValidite: "2026-02-01",
    ...overrides,
  } as Devis;
}

const editInput = {
  clientId: "c1",
  clientNom: "Client A",
  nature: "Transit import",
  droitDouane: 100000,
  fraisCircuit: 50000,
  fraisPrestation: 30000,
  dateValidite: "2026-02-01",
};

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({ devis: [devis()], ports: [], auditLogs: [], auditSeq: 1 });
});

describe("updateDevis — un devis Accepté est terminal", () => {
  it("rejette toute modification d’un devis déjà Accepté, sans appeler l’API", async () => {
    useStore.setState({ devis: [devis({ statut: "Accepté" })] });

    await expect(useStore.getState().updateDevis("dv1", editInput)).rejects.toThrow(/déjà accepté/i);
    expect(mockApi.devis.update).not.toHaveBeenCalled();
  });

  it("autorise la modification tant que le devis est en Brouillon", async () => {
    mockApi.devis.update.mockResolvedValueOnce({});

    await useStore.getState().updateDevis("dv1", editInput);

    expect(mockApi.devis.update).toHaveBeenCalled();
  });
});

describe("updateDevisStatut — matrice de transitions", () => {
  it("rejette une transition non autorisée (Accepté -> Brouillon, terminal)", async () => {
    useStore.setState({ devis: [devis({ statut: "Accepté" })] });

    await expect(useStore.getState().updateDevisStatut("dv1", "Brouillon")).rejects.toThrow(/Transition non autorisée/);
  });

  it("autorise une transition valide (Brouillon -> Envoyé)", async () => {
    mockApi.devis.update.mockResolvedValueOnce({});

    await useStore.getState().updateDevisStatut("dv1", "Envoyé");

    expect(useStore.getState().devis[0].statut).toBe("Envoyé");
  });

  it("autorise Envoyé -> Accepté", async () => {
    mockApi.devis.update.mockResolvedValueOnce({});
    useStore.setState({ devis: [devis({ statut: "Envoyé" })] });

    await useStore.getState().updateDevisStatut("dv1", "Accepté");

    expect(useStore.getState().devis[0].statut).toBe("Accepté");
  });

  it("rejette une régression Refusé -> Accepté (pas dans la matrice)", async () => {
    useStore.setState({ devis: [devis({ statut: "Refusé" })] });

    await expect(useStore.getState().updateDevisStatut("dv1", "Accepté")).rejects.toThrow(/Transition non autorisée/);
  });
});
