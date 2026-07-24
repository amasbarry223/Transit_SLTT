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
    activeAdminCount: 2,
    updateUserByIdError: null as { message: string } | null,
    profileUpdateError: null as { message: string } | null,
    deleteUserError: null as { message: string } | null,
    updateUserByIdCalls: [] as { id: string; payload: unknown }[],
    deleteUserCalls: [] as string[],
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
      fakeState.activeAdminCount = 2;
      fakeState.updateUserByIdError = null;
      fakeState.profileUpdateError = null;
      fakeState.deleteUserError = null;
      fakeState.updateUserByIdCalls.length = 0;
      fakeState.deleteUserCalls.length = 0;
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
      select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.count) {
          return {
            eq: () => ({
              eq: async () => ({ count: fakeState.activeAdminCount, error: null }),
            }),
          };
        }
        return {
          eq: (_field: string, id: string) => ({
            single: async () => {
              const p = lookupProfile(id);
              return p ? { data: p, error: null } : { data: null, error: { message: "not found" } };
            },
          }),
        };
      },
      update: (payload: Record<string, unknown>) => ({
        eq: (_field: string, id: string) => ({
          select: () => ({
            single: async () =>
              fakeState.profileUpdateError
                ? { data: null, error: fakeState.profileUpdateError }
                : { data: { ...lookupProfile(id), ...payload, id }, error: null },
          }),
        }),
      }),
    }),
    auth: {
      admin: {
        updateUserById: async (id: string, payload: unknown) => {
          fakeState.updateUserByIdCalls.push({ id, payload });
          return { error: fakeState.updateUserByIdError };
        },
        deleteUser: async (id: string) => {
          fakeState.deleteUserCalls.push(id);
          return { error: fakeState.deleteUserError };
        },
      },
    },
  }),
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
    fakeState.callerProfile.role = "Administrateur";
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
    expect(fakeState.updateUserByIdCalls).toHaveLength(1);
  });

  it("renvoie l'erreur si updateUserById échoue", async () => {
    fakeState.updateUserByIdError = { message: "auth update failed" };
    const res = await PATCH(patchReq(validPatchBody), ctx("target1"));
    expect(res.status).toBe(400);
  });

  it("renvoie l'erreur si l'écriture du profil échoue", async () => {
    fakeState.profileUpdateError = { message: "profile update failed" };
    const res = await PATCH(patchReq(validPatchBody), ctx("target1"));
    expect(res.status).toBe(400);
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
    fakeState.callerProfile.role = "Administrateur";
    fakeState.callerProfile.permissions = [];
    fakeState.profilesById.target1.role = "Administrateur";
    fakeState.activeAdminCount = 1;
    const res = await DELETE(deleteReq(), ctx("target1"));
    expect(res.status).toBe(400);
    expect(fakeState.deleteUserCalls).toHaveLength(0);
  });

  it("supprime un utilisateur normal avec succès", async () => {
    const res = await DELETE(deleteReq(), ctx("target1"));
    expect(res.status).toBe(200);
    expect(fakeState.deleteUserCalls).toEqual(["target1"]);
  });
});
