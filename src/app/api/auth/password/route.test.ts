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
    // Erreur renvoyée par `PATCH /auth/password` côté NestJS (null = succès).
    changePasswordError: null as { status: number; message: string } | null,
    changePasswordCalls: [] as { payload: unknown }[],
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.profile.actif = true;
      fakeState.changePasswordError = null;
      fakeState.changePasswordCalls = [];
    },
  };
});

vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string, options?: RequestInit) => {
    const method = options?.method?.toUpperCase() || "GET";

    // /auth/me — utilisé par requireUser()
    if (typeof url === "string" && url.includes("/auth/me")) {
      const p = fakeState.profile;
      if (!p.actif) return new Response(JSON.stringify({ message: "Inactif." }), { status: 403 });
      return new Response(JSON.stringify(p), { status: 200 });
    }

    // PATCH /auth/password — endpoint NestJS appelé directement par la route
    if (typeof url === "string" && url.includes("/auth/password") && method === "PATCH") {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      fakeState.changePasswordCalls.push({ payload: body });
      if (fakeState.changePasswordError) {
        return new Response(JSON.stringify({ message: fakeState.changePasswordError.message }), {
          status: fakeState.changePasswordError.status,
        });
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
      ...(withAuth ? { cookie: "transit_sltt_at=tok" } : {}),
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

  it("propage l'erreur si le mot de passe actuel est incorrect", async () => {
    fakeState.changePasswordError = { status: 400, message: "Mot de passe actuel incorrect." };
    const res = await PATCH(req({ currentPassword: "wrong", newPassword: "Newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Mot de passe actuel incorrect.");
  });

  it("change le mot de passe quand la vérification réussit", async () => {
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "Newpass123" }));
    expect(res.status).toBe(200);
    expect(fakeState.changePasswordCalls).toEqual([
      { payload: { currentPassword: "old12345", newPassword: "Newpass123" } },
    ]);
  });

  it("propage l'erreur si la mise à jour échoue", async () => {
    fakeState.changePasswordError = { status: 400, message: "update failed" };
    const res = await PATCH(req({ currentPassword: "old12345", newPassword: "Newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("update failed");
  });
});
