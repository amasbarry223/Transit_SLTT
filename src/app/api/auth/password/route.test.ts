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
    loginError: null as string | null,
    updateUserError: null as string | null,
    updateCalls: [] as { id: string; payload: unknown }[],
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.profile.actif = true;
      fakeState.loginError = null;
      fakeState.updateUserError = null;
      fakeState.updateCalls = [];
    },
  };
});

vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string, options?: RequestInit) => {
    const method = options?.method?.toUpperCase() || "GET";

    // /auth/me
    if (typeof url === "string" && url.includes("/auth/me")) {
      const p = fakeState.profile;
      if (!p.actif) return new Response(JSON.stringify({ message: "Inactif." }), { status: 403 });
      return new Response(JSON.stringify(p), { status: 200 });
    }

    // POST /auth/login (vérification mot de passe actuel)
    if (typeof url === "string" && url.includes("/auth/login") && method === "POST") {
      if (fakeState.loginError) {
        return new Response(JSON.stringify({ message: fakeState.loginError }), { status: 401 });
      }
      return new Response(JSON.stringify({ accessToken: "mock-tok" }), { status: 200 });
    }

    // PUT /users/:id (mise à jour mot de passe)
    if (typeof url === "string" && /\/users\/[^/]+$/.test(url) && method === "PUT") {
      const id = url.split("/").pop() || "";
      const body = options?.body ? JSON.parse(options.body as string) : {};
      fakeState.updateCalls.push({ id, payload: body });

      if (fakeState.updateUserError) {
        return new Response(JSON.stringify({ message: fakeState.updateUserError }), { status: 400 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
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
  vi.clearAllMocks();
});

describe("PATCH /api/auth/password", () => {
  it("rejette sans authentification", async () => {
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "Newpass123" }, false));
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
    fakeState.loginError = "Email ou mot de passe incorrect";
    const res = await PATCH(req({ currentPassword: "wrong", newPassword: "Newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Mot de passe actuel incorrect.");
    expect(fakeState.updateCalls).toHaveLength(0);
  });

  it("change le mot de passe quand la vérification réussit", async () => {
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "Newpass123" }));
    expect(res.status).toBe(200);
    expect(fakeState.updateCalls).toEqual([
      { id: "u1", payload: { password: "Newpass123" } },
    ]);
  });

  it("renvoie l'erreur si la mise à jour échoue", async () => {
    fakeState.updateUserError = "update failed";
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "Newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("update failed");
  });
});
