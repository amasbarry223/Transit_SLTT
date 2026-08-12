import { describe, expect, it } from "vitest";
import {
  computeMontantFromQuantitePrixUnitaire,
  computeOperationsTotals,
  computeRunningEcart,
  filterOperationsByEntite,
  filterOperationsByPeriode,
  resolveEntitesComptables,
} from "@/lib/comptabilite-generale";
import type { Annexe, OperationComptable, Societe } from "@/lib/domain-types";

const annexes: Annexe[] = [
  { id: "a-ci", nom: "Côte d'Ivoire", code: "CI", villeSiege: "Abidjan", devise: "FCFA", actif: true },
  { id: "a-ml", nom: "Mali", code: "ML", villeSiege: "Bamako", devise: "FCFA", actif: true },
];

const societes: Societe[] = [
  { id: "s-td", nom: "Top Doumani", actif: true, afficherNomAvecLogo: true },
  { id: "s-sltt", nom: "SLTT", actif: true, isTransit: true, afficherNomAvecLogo: true },
];

function op(partial: Partial<OperationComptable>): OperationComptable {
  return {
    id: partial.id ?? "o1",
    reference: partial.reference ?? "OPC-1",
    entiteType: partial.entiteType ?? "annexe",
    annexeId: partial.annexeId,
    societeId: partial.societeId,
    date: partial.date ?? "2026-01-01",
    clientNom: partial.clientNom ?? "Client",
    nature: partial.nature ?? "Frais",
    type: partial.type ?? "Entrée",
    montant: partial.montant ?? 0,
    quantite: partial.quantite,
    prixUnitaire: partial.prixUnitaire,
    source: partial.source ?? "saisie",
  };
}

describe("resolveEntitesComptables", () => {
  it("trie les annexes par nom et ajoute Top Doumani si présente", () => {
    const entites = resolveEntitesComptables(annexes, societes);
    expect(entites.map((e) => e.label)).toEqual([
      "Annexe Côte d'Ivoire",
      "Annexe Mali",
      "Société Top Doumani",
    ]);
  });

  it("n'ajoute pas d'entité société si Top Doumani est absente", () => {
    const entites = resolveEntitesComptables(annexes, [societes[1]]);
    expect(entites).toHaveLength(2);
  });
});

describe("filterOperationsByEntite", () => {
  it("isole les opérations d'une annexe donnée", () => {
    const ops = [
      op({ id: "1", entiteType: "annexe", annexeId: "a-ml" }),
      op({ id: "2", entiteType: "annexe", annexeId: "a-ci" }),
      op({ id: "3", entiteType: "societe", societeId: "s-td" }),
    ];
    const entiteMali = resolveEntitesComptables(annexes, societes)[1];
    expect(filterOperationsByEntite(ops, entiteMali).map((o) => o.id)).toEqual(["1"]);
  });
});

describe("filterOperationsByPeriode", () => {
  it("filtre par bornes de date inclusives", () => {
    const ops = [op({ id: "1", date: "2026-01-05" }), op({ id: "2", date: "2026-02-01" })];
    expect(filterOperationsByPeriode(ops, "2026-01-01", "2026-01-31").map((o) => o.id)).toEqual(["1"]);
  });
});

describe("computeOperationsTotals", () => {
  it("calcule le solde théorique = entrées - sorties", () => {
    const ops = [
      op({ type: "Entrée", montant: 9095000 }),
      op({ type: "Sortie", montant: 555000 }),
      op({ type: "Sortie", montant: 2000000 }),
    ];
    const totals = computeOperationsTotals(ops);
    expect(totals.totalEntree).toBe(9095000);
    expect(totals.totalSortie).toBe(2555000);
    expect(totals.soldeTheorique).toBe(6540000);
  });
});

describe("computeMontantFromQuantitePrixUnitaire", () => {
  it("multiplie quantité et prix unitaire quand les deux sont valides", () => {
    expect(computeMontantFromQuantitePrixUnitaire(50, 5000)).toBe(250000);
  });

  it("retourne null si un des deux facteurs manque", () => {
    expect(computeMontantFromQuantitePrixUnitaire(undefined, 5000)).toBeNull();
    expect(computeMontantFromQuantitePrixUnitaire(50, undefined)).toBeNull();
  });
});

describe("computeRunningEcart", () => {
  it("cumule dans l'ordre de saisie (référence), pas la date — régression sur les vraies données Top Doumani", () => {
    // Feuille "TOP DOUMANI" (Généralités STLL) : Djiby Diarra saisi avant Ami
    // Kouma alors que leurs dates s'entrelacent (26/11, 27/12, 08/01 vs
    // 26/11, 31/12, 03/01) — le classeur suit l'ordre d'écriture, pas la
    // date. Écart affiché dans le fichier : 5 400 000 à la ligne "Djiby
    // Diarra — Paiement dette", 6 520 000 à "Ami Kouma — Paiement dette".
    const ops = [
      op({ id: "1", reference: "OPC-1", date: "2025-11-26", type: "Sortie", montant: 1_080_000 }), // Djiby Diarra — Cartons
      op({ id: "2", reference: "OPC-2", date: "2025-12-27", type: "Sortie", montant: 5_400_000 }), // Djiby Diarra — Cartons
      op({ id: "3", reference: "OPC-3", date: "2026-01-08", type: "Entrée", montant: 1_080_000 }), // Djiby Diarra — Paiement dette
      op({ id: "4", reference: "OPC-4", date: "2025-11-26", type: "Sortie", montant: 550_000 }), // Ami Kouma — cartons
      op({ id: "5", reference: "OPC-5", date: "2025-12-31", type: "Sortie", montant: 1_120_000 }), // Ami Kouma — cartons
      op({ id: "6", reference: "OPC-6", date: "2026-01-03", type: "Entrée", montant: 550_000 }), // Ami Kouma — Paiement dette
    ];

    const result = computeRunningEcart(ops);
    expect(result.find((r) => r.operation.id === "3")?.ecartCumule).toBe(-5_400_000);
    expect(result.find((r) => r.operation.id === "6")?.ecartCumule).toBe(-6_520_000);
  });

  it("ignore l'ordre du tableau en entrée et retrie par référence", () => {
    const ops = [
      op({ id: "b", reference: "OPC-2", type: "Sortie", montant: 100 }),
      op({ id: "a", reference: "OPC-1", type: "Entrée", montant: 300 }),
    ];
    const result = computeRunningEcart(ops);
    expect(result.map((r) => r.operation.id)).toEqual(["a", "b"]);
    expect(result.map((r) => r.ecartCumule)).toEqual([300, 200]);
  });
});
