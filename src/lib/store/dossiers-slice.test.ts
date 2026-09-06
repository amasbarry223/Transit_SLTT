import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  dossiers: {
    create: vi.fn(),
    update: vi.fn(),
    updateStatut: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { Dossier } from "@/lib/store";

const baseDossier: Dossier = {
  id: "d1",
  reference: "TR-TR-2026-0001",
  annexeId: "33333333-3333-3333-3333-333333333333",
  clientId: "c1",
  clientNom: "Golaine Tech",
  bl: "BL-1",
  camion: "",
  nature: "Marchandise générale",
  droitDouane: 0,
  fraisCircuit: 0,
  fraisPrestation: 0,
  montantInvesti: 1000,
  montantPaye: 700,
  statut: "Livré",
  date: "2026-07-01",
};

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({
    dossiers: [baseDossier],
    ecritures: [],
    ecritureSeq: 1,
    clients: [],
    factures: [],
    auditLogs: [],
    auditSeq: 1,
  });
});

describe("transitionDossier (NestJS API)", () => {
  it("transitionne vers Dédouané/Livré et appelle api.dossiers.updateStatut", async () => {
    useStore.setState({ dossiers: [{ ...baseDossier, statut: "Dédouané" }] });

    await useStore.getState().transitionDossier("d1", "Livré", undefined, undefined, undefined, "2026-08-02");

    expect(mockApi.dossiers.updateStatut).toHaveBeenCalledWith("d1", "Livré");

    const dossier = useStore.getState().dossiers.find((d) => d.id === "d1");
    expect(dossier?.statut).toBe("Livré");
  });

  it("refuse Soldé si reste dû et aucun montantRecu", async () => {
    await expect(
      useStore.getState().transitionDossier("d1", "Soldé"),
    ).rejects.toThrow(/paiement doit couvrir|encaissement|montant reçu/i);

    expect(mockApi.dossiers.updateStatut).not.toHaveBeenCalled();
    expect(useStore.getState().dossiers.find((d) => d.id === "d1")?.statut).toBe("Livré");
  });

  it("autorise Soldé sans montantRecu lorsque le dossier est déjà intégralement payé", async () => {
    useStore.setState({
      dossiers: [{ ...baseDossier, montantPaye: 1000, montantInvesti: 1000 }],
    });

    await useStore.getState().transitionDossier("d1", "Soldé");

    expect(mockApi.dossiers.updateStatut).toHaveBeenCalledWith("d1", "Soldé");
    expect(useStore.getState().dossiers.find((d) => d.id === "d1")?.statut).toBe("Soldé");
  });

  it("removeDossier appelle api.dossiers.delete et nettoie le store", async () => {
    await useStore.getState().removeDossier("d1");

    expect(mockApi.dossiers.delete).toHaveBeenCalledWith("d1");
    expect(useStore.getState().dossiers.find((d) => d.id === "d1")).toBeUndefined();
  });
});
