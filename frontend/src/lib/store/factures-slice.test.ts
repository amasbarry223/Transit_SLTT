import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  factures: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    enregistrerPaiement: vi.fn(),
  },
  caisse: {
    getAll: vi.fn().mockResolvedValue([]),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { Facture } from "@/lib/store";

const baseFacture: Facture = {
  id: "f1",
  numero: "FACT-2026-0001",
  dossierId: null,
  clientId: "c1",
  clientNom: "Golaine Tech",
  annexeId: "33333333-3333-3333-3333-333333333333",
  date: "2026-07-01",
  dateEcheance: "2026-07-15",
  statut: "Envoyée",
  lignes: [],
  tauxTVA: 18,
  montantHT: 1000,
  montantTVA: 180,
  montantTTC: 1180,
  montantPaye: 0,
  notes: "",
  creePar: "Test",
  creeLe: "2026-07-01",
};

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({
    factures: [baseFacture],
    dossiers: [],
    ecritures: [],
    clients: [],
    auditLogs: [],
    auditSeq: 1,
  });
});

describe("updateFacture / removeFacture — persistance serveur", () => {
  const editInput = {
    clientId: "c1",
    clientNom: "Golaine Tech",
    annexeId: "33333333-3333-3333-3333-333333333333",
    date: "2026-07-01",
    dateEcheance: "2026-07-15",
    tauxTVA: 18,
    notes: "",
    lignes: [{ description: "L1", quantite: 3, prixUnitaire: 5000 }],
  };

  it("updateFacture appelle l'API et ne mute pas le store si l'API échoue", async () => {
    mockApi.factures.update.mockRejectedValueOnce(new Error("500"));
    await expect(useStore.getState().updateFacture("f1", editInput)).rejects.toThrow();
    expect(mockApi.factures.update).toHaveBeenCalledWith("f1", expect.objectContaining({ tauxTva: 18 }));
    // rejet avant le set : la facture garde ses montants d'origine
    expect(useStore.getState().factures.find((f) => f.id === "f1")?.montantTTC).toBe(1180);
  });

  it("updateFacture met à jour le store après succès API", async () => {
    mockApi.factures.update.mockResolvedValueOnce({ id: "f1" });
    await useStore.getState().updateFacture("f1", editInput);
    expect(useStore.getState().factures.find((f) => f.id === "f1")?.montantTTC).toBe(17700);
  });

  it("removeFacture appelle l'API avant de retirer du store", async () => {
    mockApi.factures.delete.mockResolvedValueOnce({ id: "f1" });
    await useStore.getState().removeFacture("f1");
    expect(mockApi.factures.delete).toHaveBeenCalledWith("f1");
    expect(useStore.getState().factures.find((f) => f.id === "f1")).toBeUndefined();
  });

  it("removeFacture ne retire pas du store si l'API échoue", async () => {
    mockApi.factures.delete.mockRejectedValueOnce(new Error("liée à un encaissement"));
    await expect(useStore.getState().removeFacture("f1")).rejects.toThrow();
    expect(useStore.getState().factures.find((f) => f.id === "f1")).toBeDefined();
  });
});
