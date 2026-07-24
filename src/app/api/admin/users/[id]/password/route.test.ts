import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type FakeProfile = { id: string; nom: string; email: string; role: string; permissions: string[]; actif: boolean };

const { fakeState, resetFake } = vi.hoisted(() => {
  const fakeState = {
    callerProfile: {
      id: "manager1",
      nom: "Manager",
      email: "manager@sltt.ml",
      role: "Comptable",
      permissions: ["utilisateurs:manage"] as string[],
      actif: true,
    } as FakeProfile,
    profilesById: {} as Record<string, FakeProfile>,
    updateUserByIdError: null as { message: string } | null,
    updateUserByIdCalls: [] as { id: string; payload: unknown }[],
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.callerProfile = {
        id: "manager1",
        nom: "Manager",
        email: "manager@sltt.ml",
        role: "Comptable",
        permissions: ["utilisateurs:manage"],
        actif: true,
      };
      fakeState.profilesById = {
        target1: {
          id: "target1",
          nom: "Target",
          email: "target@sltt.ml",
          role: "Agent de transit",
          permissions: [],
          actif: true,
        },
      };
      fakeState.updateUserByIdError = null;
      fakeState.updateUserByIdCalls.length = 0;
    },
  };
});

function lookupProfile(id: string): FakeProfile | undefined {
  if (id === fakeState.callerProfile.id) return fakeState.callerProfile;
  return fakeState.profilesById[id];
}

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: fakeState.callerProfile.id } }, error: null }) },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: (_field: string, id: string) => ({
          single: async () => {
            const p = lookupProfile(id);
            return p ? { data: p, error: null } : { data: null, error: { message: "not found" } };
          },
        }),
      }),
    }),
    auth: {
      admin: {
        updateUserById: async (id: string, payload: unknown) => {
          fakeState.updateUserByIdCalls.push({ id, payload });
          return { error: fakeState.updateUserByIdError };
        },
      },
    },
  }),
}));

const { POST } = await import("@/app/api/admin/users/[id]/password/route");

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function req(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/admin/users/x/password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withAuth ? { authorization: "Bearer tok" } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetFake();
});

describe("POST /api/admin/users/[id]/password", () => {
  it("rejette sans authentification", async () => {
    const res = await POST(req({ password: "newpassword123" }, false), ctx("target1"));
    expect(res.status).toBe(401);
  });

  it("rejette un mot de passe trop court", async () => {
    const res = await POST(req({ password: "short" }), ctx("target1"));
    expect(res.status).toBe(400);
  });

  it("empêche un manager non-admin de réinitialiser le mot de passe d'un Administrateur", async () => {
    fakeState.profilesById.target1.role = "Administrateur";
    const res = await POST(req({ password: "newpassword123" }), ctx("target1"));
    expect(res.status).toBe(403);
    expect(fakeState.updateUserByIdCalls).toHaveLength(0);
  });

  it("autorise un manager non-admin à réinitialiser le mot de passe d'un utilisateur normal", async () => {
    const res = await POST(req({ password: "newpassword123" }), ctx("target1"));
    expect(res.status).toBe(200);
    expect(fakeState.updateUserByIdCalls).toEqual([
      { id: "target1", payload: { password: "newpassword123" } },
    ]);
  });

  it("autorise un Administrateur à réinitialiser le mot de passe de n'importe qui", async () => {
    fakeState.callerProfile.role = "Administrateur";
    fakeState.callerProfile.permissions = [];
    fakeState.profilesById.target1.role = "Administrateur";
    const res = await POST(req({ password: "newpassword123" }), ctx("target1"));
    expect(res.status).toBe(200);
  });

  it("renvoie l'erreur si la mise à jour échoue", async () => {
    fakeState.updateUserByIdError = { message: "update failed" };
    const res = await POST(req({ password: "newpassword123" }), ctx("target1"));
    expect(res.status).toBe(400);
  });
});
