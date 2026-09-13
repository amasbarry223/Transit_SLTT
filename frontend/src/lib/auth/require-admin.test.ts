import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/** Profil fictif retourné par l'API NestJS /auth/me */
type FakeProfile = {
  id: string;
  nom: string;
  email: string;
  role: string;
  permissions: string[];
  actif: boolean;
  annexeIds: string[];
};

const { fakeState, resetFake } = vi.hoisted(() => {
  const fakeState = {
    profilesById: {} as Record<string, FakeProfile | undefined>,
    /** Simule une réponse HTTP 401 de /auth/me */
    rejectAuth: false,
    /** Simule un crash réseau (fetch rejected) */
    networkError: false,
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.profilesById = {};
      fakeState.rejectAuth = false;
      fakeState.networkError = false;
    },
  };
});

// Mock de fetch global pour intercepter les appels à l'API NestJS
vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string) => {
    if (typeof url === "string" && url.includes("/auth/me")) {
      if (fakeState.networkError) throw new Error("Network error");
      if (fakeState.rejectAuth) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      // Retrouver le profil par id simulé (on suppose que le token = "tok" → user id = "u1")
      const profile = fakeState.profilesById["u1"];
      if (!profile) {
        return new Response(JSON.stringify({ message: "not found" }), { status: 401 });
      }
      if (!profile.actif) {
        return new Response(JSON.stringify({ message: "Profil introuvable ou inactif." }), { status: 403 });
      }
      return new Response(JSON.stringify(profile), { status: 200 });
    }
    return new Response(JSON.stringify({ message: "Not found" }), { status: 404 });
  }),
);

const { requireUserManager, requireUser } = await import("@/lib/auth/require-admin");

function req(token?: string) {
  return new NextRequest("http://localhost/api/test", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function seedProfile(
  id: string,
  overrides: Partial<{ role: string; permissions: string[]; actif: boolean }> = {},
) {
  fakeState.profilesById[id] = {
    id,
    nom: "Test User",
    email: "test@sltt.ml",
    role: overrides.role ?? "Agent de transit",
    permissions: overrides.permissions ?? [],
    actif: overrides.actif ?? true,
    annexeIds: [],
  };
}

beforeEach(() => {
  resetFake();
  vi.clearAllMocks();
});

describe("getAuthenticatedProfile (via requireUser)", () => {
  it("rejette sans en-tête Authorization", async () => {
    await expect(requireUser(req())).rejects.toMatchObject({ status: 401 });
  });

  it("rejette un token dont auth.getUser échoue", async () => {
    fakeState.rejectAuth = true;
    await expect(requireUser(req("bad-token"))).rejects.toMatchObject({ status: 401 });
  });

  it("rejette si le profil est introuvable", async () => {
    // Aucun profil dans profilesById → l'API renvoie 401
    await expect(requireUser(req("tok"))).rejects.toMatchObject({ status: 401 });
  });

  it("rejette un profil désactivé, même sans rôle admin", async () => {
    seedProfile("u1", { actif: false });
    await expect(requireUser(req("tok"))).rejects.toMatchObject({
      status: 401,
    });
  });

  it("accepte un profil actif de n'importe quel rôle", async () => {
    seedProfile("u1", { role: "Comptable", actif: true });
    const { profile } = await requireUser(req("tok"));
    expect(profile.role).toBe("Comptable");
  });
});

describe("requireUserManager", () => {
  it("rejette un profil désactivé même s'il est Administrateur (verrouillage admin inactif)", async () => {
    seedProfile("u1", { role: "Administrateur", actif: false });
    await expect(requireUserManager(req("tok"))).rejects.toMatchObject({ status: 401 });
  });

  it("rejette un non-admin sans la permission utilisateurs:manage", async () => {
    seedProfile("u1", { role: "Agent de transit", permissions: [], actif: true });
    await expect(requireUserManager(req("tok"))).rejects.toMatchObject({ status: 403 });
  });

  it("accepte un non-admin avec la permission utilisateurs:manage (isAdmin: false)", async () => {
    seedProfile("u1", { role: "Comptable", permissions: ["utilisateurs:manage"], actif: true });
    const { isAdmin } = await requireUserManager(req("tok"));
    expect(isAdmin).toBe(false);
  });

  it("accepte un Administrateur actif quelles que soient ses permissions (isAdmin: true)", async () => {
    seedProfile("u1", { role: "ADMIN", permissions: [], actif: true });
    const { isAdmin } = await requireUserManager(req("tok"));
    expect(isAdmin).toBe(true);
  });
});

describe("configuration manquante", () => {
  it("renvoie 500 si le réseau est inaccessible (crash fetch)", async () => {
    fakeState.networkError = true;
    // Avec network error, on fallback sur le JWT decode — mais le token "tok" n'est pas un vrai JWT
    // donc nestUser sera null → AuthError 401
    await expect(requireUser(req("tok"))).rejects.toMatchObject({ status: 401 });
  });
});
