import { describe, expect, it } from "vitest";
import type { Dossier } from "@/lib/domain-types";
import { anneesSituation, buildSituationClient } from "./situation-client";

const dossier = (over: Partial<Dossier>): Dossier =>
  ({
    id: "d",
    reference: "DOS",
    clientId: "c1",
    nature: "",
    date: "2026-01-01",
    totalContrat: 0,
    montantPaye: 0,
    paiements: [],
    depenses: [],
    ...over,
  }) as Dossier;

// Fiche Excel "Situation du client" du 11/08/2026.
const casExcel = dossier({
  id: "d1",
  date: "2026-08-11",
  nature: "conteneur pompes à eau et accessoires",
  nombreColis: 1,
  totalContrat: 12_000_000,
  paiements: [
    { date: "2026-08-11", montant: 10_800_000, mode: "VIREMENT" },
    { date: "2026-08-20", montant: 1_200_000, mode: "ESPECES" },
  ],
  depenses: [3_100_000, 250_000, 650_000, 100_000, 6_500_000, 1_100_000].map((montant) => ({
    date: "2026-08-11",
    nature: "Frais",
    categorie: "DIVERS" as const,
    montant,
  })),
});

const autre = dossier({
  id: "d2",
  date: "2025-03-02",
  nature: "Véhicule",
  totalContrat: 1_000_000,
  paiements: [{ date: "2025-03-02", montant: 400_000, mode: "WAVE" }],
  depenses: [{ date: "2025-03-02", nature: "Douane", categorie: "DOUANE", montant: 700_000 }],
});

describe("buildSituationClient", () => {
  it("reproduit la ligne Excel au franc près", () => {
    const { lignes } = buildSituationClient([casExcel], [{ dossierId: "d1", numero: "FAC-001", statut: "Soldée" }]);
    expect(lignes[0]).toMatchObject({
      nature: "conteneur pompes à eau et accessoires",
      quantite: 1,
      factures: "FAC-001",
      totalContrat: 12_000_000,
      montantPaye: 12_000_000,
      resteAPayer: 0,
      beneficeNet: 300_000,
      totalDepenses: 11_700_000,
    });
  });

  it("totalise toutes les lignes et trie par date", () => {
    const { lignes, totaux } = buildSituationClient([casExcel, autre], []);
    expect(lignes.map((l) => l.dossier.id)).toEqual(["d2", "d1"]);
    expect(totaux).toEqual({
      totalContrat: 13_000_000,
      montantPaye: 12_400_000,
      resteAPayer: 600_000,
      beneficeNet: 600_000,
      totalDepenses: 12_400_000,
    });
  });

  it("filtre par année et ignore les factures annulées", () => {
    const { lignes } = buildSituationClient(
      [casExcel, autre],
      [
        { dossierId: "d1", numero: "FAC-001", statut: "Annulée" },
        { dossierId: "d1", numero: "FAC-002", statut: "Envoyée" },
      ],
      "2026",
    );
    expect(lignes).toHaveLength(1);
    expect(lignes[0].factures).toBe("FAC-002");
  });

  it("liste les années disponibles, la plus récente d'abord", () => {
    expect(anneesSituation([autre, casExcel])).toEqual(["2026", "2025"]);
  });
});
