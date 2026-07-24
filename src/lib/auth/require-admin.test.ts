import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { fakeState, resetFake } = vi.hoisted(() => {
  const fakeState = {
    getUserResult: { data: { user: { id: "u1" } as { id: string } | null }, error: null as { message: string } | null },
    profilesById: {} as Record<string, { id: string; nom: string; email: string; role: string; permissions: string[]; actif: boolean } | undefined>,
    throwOnAdminClient: false,
    throwOnServerClient: false,
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.getUserResult = { data: { user: { id: "u1" } }, error: null };
      fakeState.profilesById = {};
      fakeState.throwOnAdminClient = false;
      fakeState.throwOnServerClient = false;
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => {
    if (fakeState.throwOnServerClient) throw new Error("Configuration Supabase manquante.");
    return {
      auth: {
        getUser: async () => fakeState.getUserResult,
      },
    };
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (fakeState.throwOnAdminClient) throw new Error("Configuration Supabase admin manquante.");
    return {
      from: (table: string) => ({
        select: () => ({
          eq: (_field: string, val: string) => ({
            single: async () => {
              const profile = table === "profiles" ? fakeState.profilesById[val] : undefined;
              return profile
                ? { data: profile, error: null }
                : { data: null, error: { message: "not found" } };
            },
          }),
        }),
      }),
    };
  },
}));

const { requireUserManager, requireUser } = await import("@/lib/auth/require-admin");

function req(token?: string) {
  return new NextRequest("http://localhost/api/test", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function seedProfile(id: string, overrides: Partial<{ role: string; permissions: string[]; actif: boolean }> = {}) {
  fakeState.profilesById[id] = {
    id,
    nom: "Test User",
    email: "test@sltt.ml",
    role: overrides.role ?? "Agent de transit",
    permissions: overrides.permissions ?? [],
    actif: overrides.actif ?? true,
  };
}

beforeEach(() => {
  resetFake();
});

describe("getAuthenticatedProfile (via requireUser)", () => {
  it("rejette sans en-tête Authorization", async () => {
    await expect(requireUser(req())).rejects.toMatchObject({ status: 401 });
  });

  it("rejette un token dont auth.getUser échoue", async () => {
    fakeState.getUserResult = { data: { user: null }, error: { message: "invalid" } };
    await expect(requireUser(req("bad-token"))).rejects.toMatchObject({ status: 401 });
  });

  it("rejette si le profil est introuvable", async () => {
    await expect(requireUser(req("tok"))).rejects.toMatchObject({ status: 403 });
  });

  it("rejette un profil désactivé, même sans rôle admin", async () => {
    seedProfile("u1", { actif: false });
    await expect(requireUser(req("tok"))).rejects.toMatchObject({
      status: 403,
      message: "Profil introuvable ou inactif.",
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
    await expect(requireUserManager(req("tok"))).rejects.toMatchObject({ status: 403 });
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
    seedProfile("u1", { role: "Administrateur", permissions: [], actif: true });
    const { isAdmin } = await requireUserManager(req("tok"));
    expect(isAdmin).toBe(true);
  });
});

describe("configuration manquante", () => {
  it("renvoie 500 si le client admin ne peut pas être construit", async () => {
    fakeState.throwOnAdminClient = true;
    await expect(requireUser(req("tok"))).rejects.toMatchObject({ status: 500 });
  });
});
