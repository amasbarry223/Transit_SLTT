import { describe, expect, it } from "vitest";
import { computeCountVariation } from "./dashboard-metrics";

describe("computeCountVariation", () => {
  // Ancré sur mars 2026 : "ce mois-ci" = mars, "le mois précédent" = février.
  const anchor = new Date(2026, 2, 15);

  it("calcule une hausse réelle entre le mois précédent et le mois courant", () => {
    const items = [
      { date: "2026-02-01" }, // février : 1
      { date: "2026-03-01" }, // mars : 1
      { date: "2026-03-10" }, // mars : 2
    ];
    // (2 - 1) / 1 * 100 = +100%
    expect(computeCountVariation(items, (i) => i.date, anchor)).toBe(100);
  });

  it("calcule une baisse réelle", () => {
    const items = [
      { date: "2026-02-01" },
      { date: "2026-02-02" },
      { date: "2026-03-01" },
    ];
    // (1 - 2) / 2 * 100 = -50%
    expect(computeCountVariation(items, (i) => i.date, anchor)).toBe(-50);
  });

  it("renvoie 0 si aucune activité ni ce mois-ci ni le précédent", () => {
    expect(computeCountVariation([], (i: { date: string }) => i.date, anchor)).toBe(0);
  });

  it("renvoie +100 si le mois précédent était à zéro et le mois courant non", () => {
    const items = [{ date: "2026-03-05" }];
    expect(computeCountVariation(items, (i) => i.date, anchor)).toBe(100);
  });

  it("ignore les éléments sans date exploitable (accesseur retournant undefined)", () => {
    const items = [
      { date: "2026-03-05" },
      { date: undefined as string | undefined },
    ];
    expect(computeCountVariation(items, (i) => i.date, anchor)).toBe(100);
  });

  it("fonctionne avec un accesseur nommé différemment (ex. createdAt d'un client)", () => {
    const clients = [
      { createdAt: "2026-02-01" },
      { createdAt: "2026-03-01" },
      { createdAt: "2026-03-02" },
    ];
    expect(computeCountVariation(clients, (c) => c.createdAt, anchor)).toBe(100);
  });
});
