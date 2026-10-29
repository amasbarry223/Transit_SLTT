import { describe, expect, it } from "vitest";
import type { OperationComptable } from "@/lib/domain-types";
import { grouperOperationsARattacher, normaliserNom } from "@/lib/rattachement-operations";

const op = (p: Partial<OperationComptable>): OperationComptable =>
  ({ id: "o", reference: "OPC-1", entiteType: "annexe", date: "2026-01-01", clientNom: "", nature: "x", type: "Entrée", montant: 100, source: "saisie", ...p }) as OperationComptable;

const clients = [
  { id: "c1", nom: "Ali Badra TRAORÉ" },
  { id: "c2", nom: "Société Zhu Hai Trading" },
  { id: "c3", nom: "Diarra" },
  { id: "c4", nom: "DIARRA" },
];

describe("normaliserNom", () => {
  it("ignore casse, accents et ponctuation", () => {
    expect(normaliserNom("  Ali-Badra  TRAORÉ ")).toBe("ali badra traore");
  });
});

describe("grouperOperationsARattacher", () => {
  it("groupe par tiers, propose une correspondance exacte et ignore les écritures déjà rattachées", () => {
    const groupes = grouperOperationsARattacher(
      [
        op({ id: "1", clientNom: "ali badra traore", montant: 100 }),
        op({ id: "2", clientNom: "ALI BADRA TRAORE", montant: 50 }),
        op({ id: "3", clientNom: "Ali Badra Traore", clientId: "c1" }),
      ],
      clients,
    );
    expect(groupes).toHaveLength(1);
    expect(groupes[0]).toMatchObject({ total: 150, suggestion: { clientId: "c1", confiance: "exacte" } });
    expect(groupes[0].operations.map((o) => o.id)).toEqual(["1", "2"]);
  });

  it("propose une correspondance probable quand un seul client contient le nom", () => {
    const [g] = grouperOperationsARattacher([op({ clientNom: "Zhu hai" })], clients);
    expect(g.suggestion).toMatchObject({ clientId: "c2", confiance: "probable" });
  });

  it("ne propose rien pour des homonymes ou un nom trop court", () => {
    const groupes = grouperOperationsARattacher([op({ id: "1", clientNom: "Diarra" }), op({ id: "2", clientNom: "EDY" })], clients);
    expect(groupes.every((g) => g.suggestion === undefined)).toBe(true);
  });
});
