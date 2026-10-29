import { describe, expect, it } from "vitest";
import { syncContratStats } from "./contrat-stats";
import type { Contrat, ContratPrestation } from "@/lib/store";

type BaseContrat = Omit<Contrat, "nbPrestations" | "nbPrestationsRealisees">;

const contrat = (id: string): BaseContrat => ({
  id,
  reference: `CTR-2026-${id}`,
  annexeId: "a1",
  clientId: "cl1",
  clientNom: "ACME",
  objet: "Entreposage",
  dateDebut: "2026-01-01",
  montant: 0,
  statut: "Actif",
  creeLe: "2026-01-01",
});

describe("syncContratStats", () => {
  it("retourne des compteurs à zéro quand un contrat n'a aucune prestation", () => {
    const [updated] = syncContratStats([], [contrat("c1")]);
    expect(updated.nbPrestations).toBe(0);
    expect(updated.nbPrestationsRealisees).toBe(0);
  });

  it("compte les prestations et les prestations réalisées du bon contrat", () => {
    const prestations: ContratPrestation[] = [
      { id: "p1", contratId: "c1", libelle: "A", statut: "Réalisée" },
      { id: "p2", contratId: "c1", libelle: "B", statut: "Prévue" },
      { id: "p3", contratId: "c1", libelle: "C", statut: "Réalisée" },
      { id: "p4", contratId: "c2", libelle: "D", statut: "Réalisée" },
    ];
    const result = syncContratStats(prestations, [contrat("c1"), contrat("c2")]);
    expect(result.find((c) => c.id === "c1")).toMatchObject({ nbPrestations: 3, nbPrestationsRealisees: 2 });
    expect(result.find((c) => c.id === "c2")).toMatchObject({ nbPrestations: 1, nbPrestationsRealisees: 1 });
  });
});
