import { describe, expect, it } from "vitest";
import { buildTresorerieParMois, computeCountVariation } from "./dashboard-metrics";
import type { OperationComptable } from "./domain-types";

function op(partial: Partial<OperationComptable>): OperationComptable {
  return {
    id: partial.id ?? "o1",
    reference: partial.reference ?? "OPC-1",
    entiteType: partial.entiteType ?? "annexe",
    annexeId: partial.annexeId,
    date: partial.date ?? "2026-01-01",
    clientNom: partial.clientNom ?? "Client",
    nature: partial.nature ?? "Frais",
    type: partial.type ?? "Entrée",
    montant: partial.montant ?? 0,
    source: partial.source ?? "saisie",
  };
}

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

describe("buildTresorerieParMois", () => {
  // Ancré sur mars 2026 : fenêtre de 12 mois = avril 2025 → mars 2026.
  const anchor = new Date(2026, 2, 15);

  it("renvoie 12 buckets à zéro si aucune opération", () => {
    const series = buildTresorerieParMois([], anchor);
    expect(series).toHaveLength(12);
    expect(series.every((m) => m.entrees === 0 && m.sorties === 0)).toBe(true);
  });

  it("agrège uniquement les Entrées si aucune Sortie n'existe", () => {
    const ops = [
      op({ id: "1", type: "Entrée", montant: 100_000, date: "2026-03-05" }),
      op({ id: "2", type: "Entrée", montant: 50_000, date: "2026-03-20" }),
    ];
    const series = buildTresorerieParMois(ops, anchor);
    const mars = series[series.length - 1];
    expect(mars.entrees).toBe(150_000);
    expect(mars.sorties).toBe(0);
    // Aucun autre mois ne doit recevoir ce montant.
    expect(series.filter((m) => m.entrees > 0)).toHaveLength(1);
  });

  it("agrège uniquement les Sorties si aucune Entrée n'existe (symétrique)", () => {
    const ops = [op({ id: "1", type: "Sortie", montant: 75_000, date: "2026-02-10" })];
    const series = buildTresorerieParMois(ops, anchor);
    const fevrier = series[series.length - 2];
    expect(fevrier.sorties).toBe(75_000);
    expect(fevrier.entrees).toBe(0);
  });

  it("exclut les opérations situées hors de la fenêtre de 12 mois", () => {
    // 14 mois avant l'ancre (janvier 2025) — hors fenêtre (avril 2025 → mars 2026).
    const ops = [op({ id: "1", type: "Entrée", montant: 999_999, date: "2025-01-15" })];
    const series = buildTresorerieParMois(ops, anchor);
    expect(series.every((m) => m.entrees === 0)).toBe(true);
  });

  it("rattache correctement les dates en bordure de mois (1er et dernier jour)", () => {
    const ops = [
      op({ id: "1", type: "Entrée", montant: 10_000, date: "2026-03-01" }),
      op({ id: "2", type: "Entrée", montant: 20_000, date: "2026-03-31" }),
    ];
    const series = buildTresorerieParMois(ops, anchor);
    const mars = series[series.length - 1];
    expect(mars.entrees).toBe(30_000);
  });
});
