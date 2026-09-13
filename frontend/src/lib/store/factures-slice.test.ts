import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  factures: {
    create: vi.fn(),
    enregistrerPaiement: vi.fn(),
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

describe("patchFactureMontantPaye (NestJS API)", () => {
  it("met à jour le montant payé et le statut de la facture", async () => {
    await useStore.getState().patchFactureMontantPaye("f1", 500);

    const facture = useStore.getState().factures.find((f) => f.id === "f1");
    expect(facture?.montantPaye).toBe(500);
    expect(facture?.statut).toBe("Partielle");
  });

  it("refuse de modifier une facture Soldée", async () => {
    useStore.setState({ factures: [{ ...baseFacture, statut: "Soldée", montantPaye: 1180 }] });

    await expect(useStore.getState().patchFactureMontantPaye("f1", 0)).rejects.toThrow(
      /Impossible de modifier le paiement/,
    );
  });

  it("refuse de modifier une facture Brouillon ou Annulée", async () => {
    useStore.setState({ factures: [{ ...baseFacture, statut: "Brouillon" }] });
    await expect(useStore.getState().patchFactureMontantPaye("f1", 100)).rejects.toThrow();

    useStore.setState({ factures: [{ ...baseFacture, statut: "Annulée" }] });
    await expect(useStore.getState().patchFactureMontantPaye("f1", 100)).rejects.toThrow();
  });
});
