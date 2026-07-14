import { describe, expect, it } from "vitest";
import { filterBySocieteAndPeriode, computeBenefice } from "./benefice";

describe("computeBenefice", () => {
  it("calcule recettes moins dépenses", () => {
    expect(computeBenefice(1000, 400)).toBe(600);
    expect(computeBenefice(400, 1000)).toBe(-600);
    expect(computeBenefice(0, 0)).toBe(0);
  });
});

describe("filterBySocieteAndPeriode", () => {
  const rows = [
    { id: "1", societeId: "s1", date: "2026-01-15" },
    { id: "2", societeId: "s2", date: "2026-01-20" },
    { id: "3", societeId: undefined, date: "2026-01-10" },
    { id: "4", societeId: "s1", date: "2026-02-01" },
  ];

  it("société null inclut toutes les lignes, y compris non affectées, pour la période", () => {
    const result = filterBySocieteAndPeriode(rows, null, 2026, 0);
    expect(result.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("une société précise exclut l'autre société ET les lignes non affectées", () => {
    const result = filterBySocieteAndPeriode(rows, "s1", 2026, 0);
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("respecte les bornes de mois/année (pas de dépassement de période)", () => {
    const resultJan = filterBySocieteAndPeriode(rows, "s1", 2026, 0);
    const resultFeb = filterBySocieteAndPeriode(rows, "s1", 2026, 1);
    expect(resultJan.map((r) => r.id)).toEqual(["1"]);
    expect(resultFeb.map((r) => r.id)).toEqual(["4"]);
  });
});
