import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/** Profil fictif NestJS */
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
    createUserResult: { id: "new-user-1", nom: "Nouveau", email: "nouveau@sltt.ml", role: "Agent de transit" } as Record<string, unknown> | null,
    createUserError: null as string | null,
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
      fakeState.createUserResult = { id: "new-user-1", nom: "Nouveau", email: "nouveau@sltt.ml", role: "Agent de transit" };
      fakeState.createUserError = null;
    },
  };
});

// Mock de fetch global
vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string, options?: RequestInit) => {
    const method = options?.method?.toUpperCase() || "GET";

    // Auth /auth/me — authentification de l'appelant
    if (typeof url === "string" && url.includes("/auth/me")) {
      const profile = fakeState.callerProfile;
      if (!profile.actif) {
        return new Response(JSON.stringify({ message: "Profil inactif." }), { status: 403 });
      }
      return new Response(JSON.stringify(profile), { status: 200 });
    }

    // POST /users — création d'un utilisateur
    if (typeof url === "string" && url.includes("/users") && method === "POST") {
      if (fakeState.createUserError) {
        return new Response(
          JSON.stringify({ message: fakeState.createUserError }),
          { status: 400 },
        );
      }
      return new Response(JSON.stringify(fakeState.createUserResult), { status: 201 });
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
  password: "Password123",
};

beforeEach(() => {
  resetFake();
  vi.clearAllMocks();
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
    expect(res.status).toBe(401);
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
    fakeState.callerProfile.role = "ADMIN";
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

  it("rejette une permission que le manager délégué ne possède pas lui-même", async () => {
    fakeState.callerProfile.permissions = ["utilisateurs:manage"];
    const res = await POST(req(validBody));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("hors périmètre délégué");
  });

  it("renvoie l'erreur si la création du compte échoue", async () => {
    fakeState.createUserError = "email already exists";
    const res = await POST(req(validBody));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("email already exists");
  });
});
