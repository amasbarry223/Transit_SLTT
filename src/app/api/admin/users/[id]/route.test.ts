import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type FakeProfile = {
  id: string;
  nom: string;
  email: string;
  role: string;
  permissions: string[];
  actif: boolean;
  annexeIds: string[];
};

const { fakeState, resetFake } = vi.hoisted(() => {
  const fakeState = {
    callerProfile: {
      id: "manager1",
      nom: "Manager",
      email: "manager@sltt.ml",
      role: "Comptable",
      permissions: ["utilisateurs:manage", "dossiers:read"] as string[],
      actif: true,
      annexeIds: [] as string[],
    } as FakeProfile,
    profilesById: {} as Record<string, FakeProfile>,
    activeAdminCount: 2,
    updateUserError: null as string | null,
    deleteUserError: null as string | null,
  };
  return {
    fakeState,
    resetFake: () => {
      fakeState.callerProfile = {
        id: "manager1",
        nom: "Manager",
        email: "manager@sltt.ml",
        role: "Comptable",
        permissions: ["utilisateurs:manage", "dossiers:read"],
        actif: true,
        annexeIds: [],
      };
      fakeState.profilesById = {
        target1: {
          id: "target1",
          nom: "Target",
          email: "target@sltt.ml",
          role: "Agent de transit",
          permissions: [],
          actif: true,
          annexeIds: [],
        },
      };
      fakeState.activeAdminCount = 2;
      fakeState.updateUserError = null;
      fakeState.deleteUserError = null;
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

    // GET /users/:id
    if (typeof url === "string" && /\/users\/[^/]+$/.test(url) && method === "GET") {
      const id = url.split("/").pop() || "";
      const profile = id === fakeState.callerProfile.id ? fakeState.callerProfile : fakeState.profilesById[id];
      if (!profile) return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
      return new Response(JSON.stringify(profile), { status: 200 });
    }

    // GET /users (liste pour compter les admins)
    if (typeof url === "string" && url.endsWith("/users") && method === "GET") {
      const admins = Array.from({ length: fakeState.activeAdminCount }, (_, i) => ({
        id: `admin${i}`,
        role: "ADMIN",
        actif: true,
      }));
      return new Response(JSON.stringify(admins), { status: 200 });
    }

    // PUT /users/:id — mise à jour
    if (typeof url === "string" && /\/users\/[^/]+$/.test(url) && method === "PUT") {
      if (fakeState.updateUserError) {
        return new Response(JSON.stringify({ message: fakeState.updateUserError }), { status: 400 });
      }
      const id = url.split("/").pop() || "";
      const profile = fakeState.profilesById[id] || fakeState.callerProfile;
      return new Response(JSON.stringify({ ...profile, id }), { status: 200 });
    }

    // DELETE /users/:id
    if (typeof url === "string" && /\/users\/[^/]+$/.test(url) && method === "DELETE") {
      if (fakeState.deleteUserError) {
        return new Response(JSON.stringify({ message: fakeState.deleteUserError }), { status: 400 });
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

const { PATCH, DELETE } = await import("@/app/api/admin/users/[id]/route");

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/users/x", {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: "Bearer tok" },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest("http://localhost/api/admin/users/x", {
    method: "DELETE",
    headers: { authorization: "Bearer tok" },
  });
}

const validPatchBody = {
  nom: "Target Renamed",
  email: "target@sltt.ml",
  role: "Agent de transit",
  permissions: ["dossiers:read"],
};

beforeEach(() => {
  resetFake();
  vi.clearAllMocks();
});

describe("PATCH /api/admin/users/[id]", () => {
  it("empêche de se désactiver soi-même", async () => {
    const res = await PATCH(patchReq({ ...validPatchBody, actif: false }), ctx("manager1"));
    expect(res.status).toBe(400);
  });

  it("empêche un non-admin de promouvoir un compte en Administrateur", async () => {
    const res = await PATCH(patchReq({ ...validPatchBody, role: "Administrateur" }), ctx("target1"));
    expect(res.status).toBe(403);
  });

  it("empêche un non-admin de modifier un compte déjà Administrateur", async () => {
    fakeState.profilesById.target1.role = "Administrateur";
    const res = await PATCH(patchReq(validPatchBody), ctx("target1"));
    expect(res.status).toBe(403);
  });

  it("empêche de retirer les droits du dernier administrateur actif (désactivation)", async () => {
    fakeState.callerProfile.role = "ADMIN";
    fakeState.callerProfile.permissions = [];
    fakeState.profilesById.target1.role = "Administrateur";
    fakeState.activeAdminCount = 1;
    const res = await PATCH(
      patchReq({ ...validPatchBody, role: "Administrateur", actif: false }),
      ctx("target1"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("dernier administrateur actif");
  });

  it("autorise la mise à jour d'un utilisateur normal par un manager non-admin", async () => {
    const res = await PATCH(patchReq(validPatchBody), ctx("target1"));
    expect(res.status).toBe(200);
  });

  it("refuse d'attribuer des permissions hors périmètre du délégué", async () => {
    const res = await PATCH(
      patchReq({ ...validPatchBody, permissions: ["dossiers:read", "factures:write"] }),
      ctx("target1"),
    );
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/admin/users/[id]", () => {
  it("empêche de se supprimer soi-même", async () => {
    const res = await DELETE(deleteReq(), ctx("manager1"));
    expect(res.status).toBe(400);
  });

  it("empêche un non-admin de supprimer un compte Administrateur", async () => {
    fakeState.profilesById.target1.role = "Administrateur";
    const res = await DELETE(deleteReq(), ctx("target1"));
    expect(res.status).toBe(403);
  });

  it("empêche de supprimer le dernier administrateur actif", async () => {
    fakeState.callerProfile.role = "ADMIN";
    fakeState.callerProfile.permissions = [];
    fakeState.profilesById.target1.role = "Administrateur";
    fakeState.activeAdminCount = 1;
    const res = await DELETE(deleteReq(), ctx("target1"));
    expect(res.status).toBe(400);
  });

  it("supprime un utilisateur normal avec succès", async () => {
    const res = await DELETE(deleteReq(), ctx("target1"));
    expect(res.status).toBe(200);
  });
});
