import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type FakeProfile = {
  id: string;
  nom: string;
  email: string;
  role: string;
  permissions: string[];
  actif: boolean;
};

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
    updatePasswordError: null as string | null,
    passwordPatchCalls: [] as { id: string; body: unknown }[],
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
      fakeState.updatePasswordError = null;
      fakeState.passwordPatchCalls = [];
    },
  };
});

vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string, options?: RequestInit) => {
    const method = options?.method?.toUpperCase() || "GET";

    // Auth /auth/me
    if (typeof url === "string" && url.includes("/auth/me")) {
      const p = fakeState.callerProfile;
      if (!p.actif) return new Response(JSON.stringify({ message: "Inactif." }), { status: 403 });
      return new Response(JSON.stringify(p), { status: 200 });
    }

    // PATCH /users/:id/password
    if (typeof url === "string" && /\/users\/[^/]+\/password$/.test(url) && method === "PATCH") {
      const parts = url.split("/");
      const id = parts[parts.length - 2];
      const body = options?.body ? JSON.parse(options.body as string) : {};
      fakeState.passwordPatchCalls.push({ id, body });

      if (fakeState.updatePasswordError) {
        return new Response(JSON.stringify({ message: fakeState.updatePasswordError }), { status: 400 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // GET /users/:id
    if (typeof url === "string" && /\/users\/[^/]+$/.test(url) && method === "GET") {
      const id = url.split("/").pop() || "";
      const profile = id === fakeState.callerProfile.id ? fakeState.callerProfile : fakeState.profilesById[id];
      if (!profile) return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
      return new Response(JSON.stringify(profile), { status: 200 });
    }

    // Audit
    if (typeof url === "string" && url.includes("/audit")) {
      return new Response(JSON.stringify({ ok: true }), { status: 201 });
    }

    return new Response(JSON.stringify({ message: "Not found" }), { status: 404 });
  }),
);

vi.mock("@/lib/auth/admin-audit", () => ({
  insertAdminAuditLog: async () => {},
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
  vi.clearAllMocks();
});

describe("POST /api/admin/users/[id]/password", () => {
  it("rejette sans authentification", async () => {
    const res = await POST(req({ password: "Newpassword123" }, false), ctx("target1"));
    expect(res.status).toBe(401);
  });

  it("rejette un mot de passe trop court", async () => {
    const res = await POST(req({ password: "short" }), ctx("target1"));
    expect(res.status).toBe(400);
  });

  it("empêche un manager non-admin de réinitialiser le mot de passe d'un Administrateur", async () => {
    fakeState.profilesById.target1.role = "Administrateur";
    const res = await POST(req({ password: "Newpassword123" }), ctx("target1"));
    expect(res.status).toBe(403);
    expect(fakeState.passwordPatchCalls).toHaveLength(0);
  });

  it("autorise un manager non-admin à réinitialiser le mot de passe d'un utilisateur normal", async () => {
    const res = await POST(req({ password: "Newpassword123" }), ctx("target1"));
    expect(res.status).toBe(200);
    expect(fakeState.passwordPatchCalls).toEqual([
      { id: "target1", body: { motDePasse: "Newpassword123" } },
    ]);
  });

  it("autorise un Administrateur à réinitialiser le mot de passe de n'importe qui", async () => {
    fakeState.callerProfile.role = "Administrateur";
    fakeState.callerProfile.permissions = [];
    fakeState.profilesById.target1.role = "Administrateur";
    const res = await POST(req({ password: "Newpassword123" }), ctx("target1"));
    expect(res.status).toBe(200);
    expect(fakeState.passwordPatchCalls).toEqual([
      { id: "target1", body: { motDePasse: "Newpassword123" } },
    ]);
  });

  it("renvoie l'erreur si la mise à jour échoue", async () => {
    fakeState.updatePasswordError = "update failed";
    const res = await POST(req({ password: "Newpassword123" }), ctx("target1"));
    expect(res.status).toBe(400);
  });
});
