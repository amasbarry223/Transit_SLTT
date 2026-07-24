import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { fakeState, resetFake } = vi.hoisted(() => {
  const fakeState = {
    callerProfile: {
      id: "manager1",
      nom: "Manager",
      email: "manager@sltt.ml",
      role: "Comptable",
      permissions: ["utilisateurs:manage"] as string[],
      actif: true,
    },
    createUserResult: {
      data: { user: { id: "new-user-1" } as { id: string } | null },
      error: null as { message: string } | null,
    },
    profileUpdateError: null as { message: string } | null,
    deleteUserCalls: [] as string[],
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.callerProfile.role = "Comptable";
      fakeState.callerProfile.permissions = ["utilisateurs:manage"];
      fakeState.callerProfile.actif = true;
      fakeState.createUserResult = { data: { user: { id: "new-user-1" } }, error: null };
      fakeState.profileUpdateError = null;
      fakeState.deleteUserCalls.length = 0;
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "manager1" } }, error: null }) },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      // profile lookup used by requireUserManager
      select: () => ({
        eq: () => ({
          single: async () => ({ data: fakeState.callerProfile, error: null }),
        }),
      }),
      // profile update after auth-user creation
      update: (payload: Record<string, unknown>) => ({
        eq: (_field: string, id: string) => ({
          select: () => ({
            single: async () =>
              fakeState.profileUpdateError
                ? { data: null, error: fakeState.profileUpdateError }
                : { data: { id, ...payload }, error: null },
          }),
        }),
      }),
    }),
    auth: {
      admin: {
        createUser: async () => fakeState.createUserResult,
        deleteUser: async (id: string) => {
          fakeState.deleteUserCalls.push(id);
          return { error: null };
        },
      },
    },
  }),
}));

const { POST } = await import("@/app/api/admin/users/route");

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer tok" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  nom: "Nouveau",
  email: "nouveau@sltt.ml",
  role: "Agent de transit",
  permissions: ["dossiers:read"],
  password: "password123",
};

beforeEach(() => {
  resetFake();
});

describe("POST /api/admin/users", () => {
  it("rejette sans authentification", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejette un profil désactivé", async () => {
    fakeState.callerProfile.actif = false;
    const res = await POST(req(validBody));
    expect(res.status).toBe(403);
  });

  it("rejette un manager sans permission utilisateurs:manage", async () => {
    fakeState.callerProfile.permissions = [];
    const res = await POST(req(validBody));
    expect(res.status).toBe(403);
  });

  it("rejette un mot de passe trop court", async () => {
    const res = await POST(req({ ...validBody, password: "short" }));
    expect(res.status).toBe(400);
  });

  it("rejette un rôle invalide", async () => {
    const res = await POST(req({ ...validBody, role: "Superadmin" }));
    expect(res.status).toBe(400);
  });

  it("empêche un manager non-admin de créer un compte Administrateur", async () => {
    const res = await POST(req({ ...validBody, role: "Administrateur" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Seul un administrateur");
  });

  it("autorise un Administrateur à créer un autre compte Administrateur", async () => {
    fakeState.callerProfile.role = "Administrateur";
    fakeState.callerProfile.permissions = [];
    const res = await POST(req({ ...validBody, role: "Administrateur" }));
    expect(res.status).toBe(201);
  });

  it("autorise un manager non-admin à créer un compte non-admin", async () => {
    const res = await POST(req(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.id).toBe("new-user-1");
  });

  it("renvoie l'erreur si la création du compte auth échoue", async () => {
    fakeState.createUserResult = { data: { user: null }, error: { message: "email already exists" } };
    const res = await POST(req(validBody));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("email already exists");
  });

  it("supprime le compte auth orphelin si l'écriture du profil échoue (rollback)", async () => {
    fakeState.profileUpdateError = { message: "profile insert failed" };
    const res = await POST(req(validBody));
    expect(res.status).toBe(400);
    expect(fakeState.deleteUserCalls).toEqual(["new-user-1"]);
  });
});
