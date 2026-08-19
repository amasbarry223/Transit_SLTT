import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { fakeState, resetFake } = vi.hoisted(() => {
  const fakeState = {
    profile: {
      id: "u1",
      nom: "Test User",
      email: "test@sltt.ml",
      role: "Agent de transit",
      permissions: ["clients:read"] as string[],
      actif: true,
    },
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.profile.actif = true;
      fakeState.profile.permissions = ["clients:read"];
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "u1" } }, error: null }),
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
  }),
}));

const { POST } = await import("@/app/api/export/excel/route");

function req(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/export/excel", {
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

describe("POST /api/export/excel", () => {
  it("rejette sans authentification", async () => {
    const res = await POST(req({ module: "clients" }, false));
    expect(res.status).toBe(401);
  });

  it("autorise quand la permission du module est présente", async () => {
    const res = await POST(req({ module: "clients" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("rejette sans permission de lecture métier", async () => {
    fakeState.profile.permissions = [];
    const res = await POST(req({ module: "clients" }));
    expect(res.status).toBe(403);
  });

  it("rejette un module sans permission dédiée", async () => {
    fakeState.profile.permissions = ["clients:read"];
    const res = await POST(req({ module: "dossiers" }));
    expect(res.status).toBe(403);
  });

  it("rejette sans champ module", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });
});
