import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { fakeState, resetFake } = vi.hoisted(() => {
  const fakeState = {
    profile: {
      id: "u1",
      nom: "Test User",
      email: "test@sltt.ml",
      role: "Agent de transit",
      permissions: [] as string[],
      actif: true,
    },
    signInError: null as { message: string } | null,
    updateUserError: null as { message: string } | null,
    updateUserByIdCalls: [] as { id: string; payload: unknown }[],
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.profile.actif = true;
      fakeState.signInError = null;
      fakeState.updateUserError = null;
      fakeState.updateUserByIdCalls.length = 0;
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "u1" } }, error: null }),
      signInWithPassword: async () => ({ error: fakeState.signInError }),
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: fakeState.profile, error: null }),
        }),
      }),
    }),
    auth: {
      admin: {
        updateUserById: async (id: string, payload: unknown) => {
          fakeState.updateUserByIdCalls.push({ id, payload });
          return { error: fakeState.updateUserError };
        },
      },
    },
  }),
}));

const { PATCH } = await import("@/app/api/auth/password/route");

function req(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/auth/password", {
    method: "PATCH",
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

describe("PATCH /api/auth/password", () => {
  it("rejette sans authentification", async () => {
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "new12345" }, false));
    expect(res.status).toBe(401);
  });

  it("rejette si un des deux mots de passe manque", async () => {
    const res = await PATCH(req({ currentPassword: "old12345" }));
    expect(res.status).toBe(400);
  });

  it("rejette un nouveau mot de passe trop court", async () => {
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "short" }));
    expect(res.status).toBe(400);
  });

  it("rejette si le mot de passe actuel est incorrect", async () => {
    fakeState.signInError = { message: "invalid" };
    const res = await PATCH(req({ currentPassword: "wrong", newPassword: "new12345" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Mot de passe actuel incorrect.");
    expect(fakeState.updateUserByIdCalls).toHaveLength(0);
  });

  it("change le mot de passe quand la vérification réussit", async () => {
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "new12345" }));
    expect(res.status).toBe(200);
    expect(fakeState.updateUserByIdCalls).toEqual([
      { id: "u1", payload: { password: "new12345" } },
    ]);
  });

  it("renvoie l'erreur si la mise à jour Supabase échoue", async () => {
    fakeState.updateUserError = { message: "update failed" };
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "new12345" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("update failed");
  });
});
