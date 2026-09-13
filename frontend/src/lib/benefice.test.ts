import { describe, expect, it } from "vitest";
import { filterByPeriode, computeBenefice } from "./benefice";

describe("computeBenefice", () => {
  it("calcule recettes moins dépenses", () => {
    expect(computeBenefice(1000, 400)).toBe(600);
    expect(computeBenefice(400, 1000)).toBe(-600);
    expect(computeBenefice(0, 0)).toBe(0);
  });
});

describe("filterByPeriode", () => {
  const rows = [
    { id: "1", date: "2026-01-15" },
    { id: "2", date: "2026-01-20" },
    { id: "3", date: "2026-01-10" },
    { id: "4", date: "2026-02-01" },
  ];

  it("inclut toutes les lignes du mois", () => {
    const result = filterByPeriode(rows, 2026, 0);
    expect(result.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("respecte les bornes de mois/année", () => {
    const resultJan = filterByPeriode(rows, 2026, 0);
    const resultFeb = filterByPeriode(rows, 2026, 1);
    expect(resultJan.map((r) => r.id)).toEqual(["1", "2", "3"]);
    expect(resultFeb.map((r) => r.id)).toEqual(["4"]);
  });
});
