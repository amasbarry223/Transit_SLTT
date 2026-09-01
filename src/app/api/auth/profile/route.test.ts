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
    updateUserError: null as { message: string } | null,
    profileUpdateError: null as { message: string } | null,
    updateUserByIdCalls: [] as { id: string; payload: unknown }[],
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.profile.actif = true;
      fakeState.profile.nom = "Test User";
      fakeState.profile.email = "test@sltt.ml";
      fakeState.updateUserError = null;
      fakeState.profileUpdateError = null;
      fakeState.updateUserByIdCalls.length = 0;
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) },
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
      update: (payload: Record<string, unknown>) => ({
        eq: () => ({
          select: () => ({
            single: async () =>
              fakeState.profileUpdateError
                ? { data: null, error: fakeState.profileUpdateError }
                : { data: { ...fakeState.profile, ...payload }, error: null },
          }),
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

vi.mock("@/lib/auth/admin-audit", () => ({
  insertAdminAuditLog: async () => {},
}));

const { PATCH } = await import("@/app/api/auth/profile/route");

function req(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/auth/profile", {
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

describe("PATCH /api/auth/profile", () => {
  it("rejette sans authentification", async () => {
    const res = await PATCH(req({ nom: "Nouveau", email: "nouveau@sltt.ml" }, false));
    expect(res.status).toBe(401);
  });

  it("synchronise nom et e-mail côté Auth et profiles", async () => {
    const res = await PATCH(req({ nom: "Nouveau Nom", email: "nouveau@sltt.ml" }));
    expect(res.status).toBe(200);
    expect(fakeState.updateUserByIdCalls).toEqual([
      { id: "u1", payload: { email: "nouveau@sltt.ml", user_metadata: { nom: "Nouveau Nom" } } },
    ]);
    const body = await res.json();
    expect(body.user.nom).toBe("Nouveau Nom");
    expect(body.user.email).toBe("nouveau@sltt.ml");
  });

  it("n'écrit pas role ni permissions dans user_metadata", async () => {
    await PATCH(req({ nom: "Nouveau Nom", email: "nouveau@sltt.ml" }));
    const payload = fakeState.updateUserByIdCalls[0]?.payload as { user_metadata?: Record<string, unknown> };
    expect(payload.user_metadata).toEqual({ nom: "Nouveau Nom" });
    expect(payload.user_metadata).not.toHaveProperty("role");
    expect(payload.user_metadata).not.toHaveProperty("permissions");
  });
});
