import ExcelJS from "exceljs";
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

async function loadWorkbook(bytes: Uint8Array) {
  const workbook = new ExcelJS.Workbook();
  // ExcelJS types Buffer étroitement vs @types/node Buffer générique.
  await workbook.xlsx.load(Buffer.from(bytes) as unknown as never);
  return workbook;
}

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
    const res = await POST(
      req(
        {
          module: "clients",
          filename: "test",
          headers: ["Ref"],
          rows: [["D-001"]],
        },
        false,
      ),
    );
    expect(res.status).toBe(401);
  });

  it("retourne un fichier xlsx non vide et réouvrable", async () => {
    const res = await POST(
      req({
        module: "clients",
        filename: "dossiers-transit",
        headers: ["Référence", "Client"],
        rows: [
          ["D-001", "ACME SARL"],
          ["D-002", "Konaté Transport"],
        ],
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml.sheet");

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);

    const workbook = await loadWorkbook(bytes);
    const sheet = workbook.getWorksheet("Export");
    expect(sheet?.getCell("A1").value).toBe("Référence");
    expect(sheet?.getCell("A2").value).toBe("D-001");
  });

  it("coerce null, booléens et NaN dans les cellules", async () => {
    const res = await POST(
      req({
        module: "clients",
        filename: "coercion",
        headers: ["A", "B", "C"],
        rows: [[null, true, Number.NaN]],
      }),
    );

    expect(res.status).toBe(200);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const workbook = await loadWorkbook(bytes);
    const sheet = workbook.getWorksheet("Export");
    expect(sheet?.getCell("A2").value).toBe("");
    expect(sheet?.getCell("B2").value).toBe("Oui");
    expect(sheet?.getCell("C2").value).toBe("");
  });

  it("rejette un export sans lignes", async () => {
    const res = await POST(
      req({
        module: "clients",
        filename: "vide",
        headers: ["Ref"],
        rows: [],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejette sans permission de lecture métier", async () => {
    fakeState.profile.permissions = [];
    const res = await POST(
      req({
        module: "clients",
        filename: "interdit",
        headers: ["Ref"],
        rows: [["D-001"]],
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejette un module sans permission dédiée", async () => {
    fakeState.profile.permissions = ["clients:read"];
    const res = await POST(
      req({
        module: "dossiers",
        filename: "interdit",
        headers: ["Ref"],
        rows: [["D-001"]],
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejette sans champ module", async () => {
    const res = await POST(
      req({
        filename: "sans-module",
        headers: ["Ref"],
        rows: [["D-001"]],
      }),
    );
    expect(res.status).toBe(400);
  });
});
