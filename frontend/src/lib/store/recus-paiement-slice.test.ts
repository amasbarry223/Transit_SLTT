import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  recusPaiement: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
import type { Annexe, RecuPaiement } from "@/lib/domain-types";

const baseAnnexe: Annexe = {
  id: "annexe-1",
  nom: "Bamako",
  code: "ML",
  villeSiege: "Bamako",
  devise: "FCFA",
  actif: true,
};

const baseRecu: RecuPaiement = {
  id: "r1",
  reference: "RECU-0001",
  annexeId: "annexe-1",
  annexeNom: "Bamako",
  nom: "Diarra",
  prenom: "Awa",
  somme: 10000,
  motif: "Frais de dossier",
  montantPaye: 4000,
  reste: 6000,
  statut: "PARTIEL",
  creePar: "Test",
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({
    recusPaiement: [baseRecu],
    recuPaiementSeq: 2,
    annexes: [baseAnnexe],
    auditLogs: [],
    auditSeq: 1,
  });
});

describe("addRecuPaiement — dérivation statut/reste", () => {
  it("statut EN_ATTENTE quand rien n’a encore été payé", async () => {
    mockApi.recusPaiement.create.mockResolvedValueOnce({ id: "new-1", reference: "RECU-0002" });

    const created = await useStore.getState().addRecuPaiement({
      annexeId: "annexe-1",
      nom: "Traoré",
      prenom: "Ali",
      somme: 5000,
      motif: "Test",
      montantPaye: 0,
    });

    expect(created.statut).toBe("EN_ATTENTE");
    expect(created.reste).toBe(5000);
  });

  it("statut PARTIEL quand un paiement partiel a été fait", async () => {
    mockApi.recusPaiement.create.mockResolvedValueOnce({ id: "new-1", reference: "RECU-0002" });

    const created = await useStore.getState().addRecuPaiement({
      annexeId: "annexe-1",
      nom: "Traoré",
      prenom: "Ali",
      somme: 5000,
      motif: "Test",
      montantPaye: 2000,
    });

    expect(created.statut).toBe("PARTIEL");
    expect(created.reste).toBe(3000);
  });

  it("statut SOLDE quand le montant payé couvre la somme totale", async () => {
    mockApi.recusPaiement.create.mockResolvedValueOnce({ id: "new-1", reference: "RECU-0002" });

    const created = await useStore.getState().addRecuPaiement({
      annexeId: "annexe-1",
      nom: "Traoré",
      prenom: "Ali",
      somme: 5000,
      motif: "Test",
      montantPaye: 5000,
    });

    expect(created.statut).toBe("SOLDE");
    expect(created.reste).toBe(0);
  });

  it("ne solde jamais un reçu de somme 0 par défaut (EN_ATTENTE, pas SOLDE)", async () => {
    mockApi.recusPaiement.create.mockResolvedValueOnce({ id: "new-1", reference: "RECU-0002" });

    const created = await useStore.getState().addRecuPaiement({
      annexeId: "annexe-1",
      nom: "Traoré",
      prenom: "Ali",
      somme: 0,
      motif: "Test",
      montantPaye: 0,
    });

    expect(created.statut).toBe("EN_ATTENTE");
  });

  it("plafonne le reste à 0 si montantPaye dépasse somme (jamais négatif)", async () => {
    mockApi.recusPaiement.create.mockResolvedValueOnce({ id: "new-1", reference: "RECU-0002" });

    const created = await useStore.getState().addRecuPaiement({
      annexeId: "annexe-1",
      nom: "Traoré",
      prenom: "Ali",
      somme: 1000,
      motif: "Test",
      montantPaye: 1500,
    });

    expect(created.reste).toBe(0);
    expect(created.statut).toBe("SOLDE");
  });

  it("la référence vient exclusivement du serveur (jamais recalculée côté client)", async () => {
    mockApi.recusPaiement.create.mockResolvedValueOnce({ id: "new-1", reference: "RECU-0099" });

    const created = await useStore.getState().addRecuPaiement({
      annexeId: "annexe-1",
      nom: "Traoré",
      prenom: "Ali",
      somme: 1000,
      motif: "Test",
      montantPaye: 0,
    });

    expect(created.reference).toBe("RECU-0099");
  });
});

describe("updateRecuPaiement", () => {
  it("recalcule statut/reste et ne mute pas le store si l’API échoue", async () => {
    mockApi.recusPaiement.update.mockRejectedValueOnce(new Error("500"));

    await expect(
      useStore.getState().updateRecuPaiement("r1", {
        annexeId: "annexe-1",
        nom: "Diarra",
        prenom: "Awa",
        somme: 10000,
        motif: "Frais de dossier",
        montantPaye: 10000,
      }),
    ).rejects.toThrow();

    // rejet avant le set : le reçu garde son statut d'origine (PARTIEL)
    expect(useStore.getState().recusPaiement.find((r) => r.id === "r1")?.statut).toBe("PARTIEL");
  });

  it("met à jour statut/reste dans le store après succès API", async () => {
    mockApi.recusPaiement.update.mockResolvedValueOnce({});

    await useStore.getState().updateRecuPaiement("r1", {
      annexeId: "annexe-1",
      nom: "Diarra",
      prenom: "Awa",
      somme: 10000,
      motif: "Frais de dossier",
      montantPaye: 10000,
    });

    const updated = useStore.getState().recusPaiement.find((r) => r.id === "r1");
    expect(updated?.statut).toBe("SOLDE");
    expect(updated?.reste).toBe(0);
  });
});

describe("removeRecuPaiement", () => {
  it("ne retire pas du store si l’API échoue", async () => {
    mockApi.recusPaiement.delete.mockRejectedValueOnce(new Error("500"));

    await expect(useStore.getState().removeRecuPaiement("r1")).rejects.toThrow();

    expect(useStore.getState().recusPaiement.find((r) => r.id === "r1")).toBeDefined();
  });

  it("retire du store après succès API", async () => {
    mockApi.recusPaiement.delete.mockResolvedValueOnce({});

    await useStore.getState().removeRecuPaiement("r1");

    expect(useStore.getState().recusPaiement.find((r) => r.id === "r1")).toBeUndefined();
  });
});
