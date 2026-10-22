import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = {
  bonsLivraison: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  notifications: {
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { useStore } = await import("@/lib/store");
const { mapBonLivraison } = await import("@/lib/store/bons-livraison-slice");

const rawBl = {
  id: "bl-1",
  reference: "LIV-2026-0001",
  date: "2026-10-22",
  bonSortieId: "bs-1",
  bonSortie: { id: "bs-1", reference: "BS-2026-0001" },
  clientId: "c1",
  clientNom: "Société Diarra",
  annexeId: "annexe-1",
  annexe: { id: "annexe-1", nom: "Bamako" },
  lignes: [{ marchandise: "Riz", quantite: 40, unite: "sac" }],
  transporteurNom: null,
  statut: "En cours",
  createdAt: "2026-10-22T08:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({ bonsLivraison: [], notifications: [], notificationsUnread: 0, addAuditLog: vi.fn() });
});

describe("mapBonLivraison", () => {
  it("reprend référence, client et bon de sortie d'origine, sans champs null", () => {
    const bl = mapBonLivraison(rawBl);
    expect(bl).toMatchObject({
      reference: "LIV-2026-0001",
      clientNom: "Société Diarra",
      bonSortieReference: "BS-2026-0001",
      annexeNom: "Bamako",
      lignes: [{ marchandise: "Riz", quantite: 40, unite: "sac" }],
      statut: "En cours",
    });
    expect(bl.transporteurNom).toBeUndefined();
  });

  it("ramène tout statut inconnu à « En cours »", () => {
    expect(mapBonLivraison({ ...rawBl, statut: "???" }).statut).toBe("En cours");
  });
});

describe("addBonLivraison", () => {
  it("n'ajoute le bon au store qu'après la réponse du serveur, en tête de liste", async () => {
    mockApi.bonsLivraison.create.mockResolvedValueOnce(rawBl);

    const created = await useStore.getState().addBonLivraison("bs-1", { chauffeurNom: "Moussa" });

    expect(mockApi.bonsLivraison.create).toHaveBeenCalledWith({ bonSortieId: "bs-1", chauffeurNom: "Moussa" });
    expect(created.reference).toBe("LIV-2026-0001");
    expect(useStore.getState().bonsLivraison.map((b) => b.id)).toEqual(["bl-1"]);
  });

  it("ne touche pas au store si le serveur refuse (ex. 409 doublon)", async () => {
    mockApi.bonsLivraison.create.mockRejectedValueOnce(new Error("déjà un bon de livraison"));

    await expect(useStore.getState().addBonLivraison("bs-1", {})).rejects.toThrow();
    expect(useStore.getState().bonsLivraison).toEqual([]);
  });
});

describe("notifications", () => {
  it("marque une notification lue de façon optimiste et décrémente le compteur", async () => {
    useStore.setState({
      notifications: [{ id: "n1", titre: "T", message: "M", lue: false, createdAt: "2026-10-22T08:00:00.000Z" }],
      notificationsUnread: 1,
    });
    mockApi.notifications.markRead.mockResolvedValueOnce({ id: "n1", lue: true });

    await useStore.getState().markNotificationRead("n1");

    expect(useStore.getState().notifications[0].lue).toBe(true);
    expect(useStore.getState().notificationsUnread).toBe(0);
  });

  it("n'appelle pas l'API pour une notification déjà lue", async () => {
    useStore.setState({
      notifications: [{ id: "n1", titre: "T", message: "M", lue: true, createdAt: "2026-10-22T08:00:00.000Z" }],
    });

    await useStore.getState().markNotificationRead("n1");

    expect(mockApi.notifications.markRead).not.toHaveBeenCalled();
  });
});
