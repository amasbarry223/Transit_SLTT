import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  comptabilite: {
    createOperation: vi.fn(),
    createCloture: vi.fn(),
    annulerOperation: vi.fn(),
    getOperations: vi.fn(),
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

describe("écritures automatiques", () => {
  it("mapOperationComptable conserve la source auto_* renvoyée par le serveur", async () => {
    const { mapOperationComptable } = await import("@/lib/store/comptabilite-generale-slice");
    const op = mapOperationComptable({ id: "o1", reference: "OPC-9", source: "auto_dossier", montant: 300, type: "Entrée" } as never);
    expect(op).toMatchObject({ id: "o1", source: "auto_dossier", montant: 300, entiteType: "annexe" });
  });

  it("isOperationAnnulable : saisie oui une seule fois, automatique et contre-passation non, sauf dossier orphelin", async () => {
    const { isOperationAnnulable } = await import("@/lib/domain-types");
    const aucune = new Set<string>();
    expect(isOperationAnnulable({ id: "a", source: "saisie", dossierId: undefined }, aucune)).toBe(true);
    expect(isOperationAnnulable({ id: "a", source: "saisie", dossierId: undefined }, new Set(["a"]))).toBe(false);
    expect(isOperationAnnulable({ id: "a", source: "contrepassation", dossierId: undefined }, aucune)).toBe(false);
    expect(isOperationAnnulable({ id: "a", source: "auto_facture", dossierId: undefined }, aucune)).toBe(false);
    expect(isOperationAnnulable({ id: "a", source: "auto_dossier", dossierId: "d1" }, aucune)).toBe(false);
    expect(isOperationAnnulable({ id: "a", source: "auto_dossier", dossierId: undefined }, aucune)).toBe(true);
  });

  it("annulerOperationComptable ajoute l'écriture inverse sans retirer l'originale", async () => {
    mockApi.comptabilite.annulerOperation.mockResolvedValueOnce({ id: "inv", reference: "OPC-2", type: "Sortie", montant: 100, source: "contrepassation" });
    useStore.setState({
      operationsComptables: [{ id: "o1", reference: "OPC-1", entiteType: "annexe", date: "2026-01-01", clientNom: "A", nature: "x", type: "Entrée", montant: 100, source: "saisie" }],
    });
    await useStore.getState().annulerOperationComptable("o1");
    const ops = useStore.getState().operationsComptables;
    expect(ops.map((o) => o.id)).toEqual(["inv", "o1"]);
    expect(ops[0].contrepasseDeId).toBe("o1");
  });
});

describe("refreshOperationsComptables", () => {
  it("conserve une opération ajoutée pendant le rechargement, absente de la réponse", async () => {
    const base = { entiteType: "annexe" as const, date: "2026-01-01", clientNom: "A", nature: "x", type: "Entrée" as const, montant: 1, source: "saisie" as const };
    useStore.setState({ operationsComptables: [{ ...base, id: "ancienne", reference: "OPC-1" }] });
    let resoudre: (v: unknown) => void = () => {};
    mockApi.comptabilite.getOperations.mockReturnValueOnce(new Promise((r) => (resoudre = r)));

    const enCours = useStore.getState().refreshOperationsComptables();
    // saisie pendant le rechargement
    useStore.setState((s) => ({ operationsComptables: [{ ...base, id: "nouvelle", reference: "OPC-2" }, ...s.operationsComptables] }));
    resoudre([{ id: "ancienne", reference: "OPC-1", montant: 1, type: "Entrée" }]);
    await enCours;

    expect(useStore.getState().operationsComptables.map((o) => o.id).sort()).toEqual(["ancienne", "nouvelle"]);
  });
});
