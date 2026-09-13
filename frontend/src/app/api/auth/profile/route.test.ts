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
    updateProfileError: null as string | null,
    patchCalls: [] as { body: unknown; headers?: Record<string, string> }[],
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.profile.actif = true;
      fakeState.profile.nom = "Test User";
      fakeState.profile.email = "test@sltt.ml";
      fakeState.updateProfileError = null;
      fakeState.patchCalls = [];
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

    // PATCH /auth/profile
    if (typeof url === "string" && url.includes("/auth/profile") && method === "PATCH") {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      fakeState.patchCalls.push({ body });

      if (fakeState.updateProfileError) {
        return new Response(JSON.stringify({ message: fakeState.updateProfileError }), { status: 400 });
      }

      const updated = { ...fakeState.profile, ...body };
      return new Response(JSON.stringify(updated), { status: 200 });
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
  vi.clearAllMocks();
});

describe("PATCH /api/auth/profile", () => {
  it("rejette sans authentification", async () => {
    const res = await PATCH(req({ nom: "Nouveau", email: "nouveau@sltt.ml" }, false));
    expect(res.status).toBe(401);
  });

  it("met à jour le profil avec succès", async () => {
    const res = await PATCH(req({ nom: "Nouveau Nom", email: "nouveau@sltt.ml" }));
    expect(res.status).toBe(200);
    expect(fakeState.patchCalls).toEqual([
      { body: { nom: "Nouveau Nom", email: "nouveau@sltt.ml" } },
    ]);
    const body = await res.json();
    expect(body.user.nom).toBe("Nouveau Nom");
    expect(body.user.email).toBe("nouveau@sltt.ml");
  });

  it("rejette un e-mail invalide", async () => {
    const res = await PATCH(req({ nom: "Nouveau Nom", email: "pas-un-email" }));
    expect(res.status).toBe(400);
    expect(fakeState.patchCalls).toHaveLength(0);
  });

  it("renvoie l'erreur en cas d'échec de mise à jour côté API", async () => {
    fakeState.updateProfileError = "Cet e-mail est déjà utilisé.";
    const res = await PATCH(req({ nom: "Nouveau Nom", email: "existant@sltt.ml" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cet e-mail est déjà utilisé.");
  });
});
