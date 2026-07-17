import { describe, expect, it } from "vitest";
import { syncContratStats } from "./contrat-stats";
import type { Contrat, ContratPrestation, Depense } from "@/lib/store";

type BaseContrat = Omit<Contrat, "nbPrestations" | "nbPrestationsRealisees" | "totalDepenses">;

describe("syncContratStats", () => {
  it("retourne des compteurs à zéro quand un contrat n'a ni dépense ni prestation", () => {
    const contrats: BaseContrat[] = [
      { id: "c1", reference: "CTR-2026-0001", societeId: "s1", societeNom: "Top Doumani", clientId: "cl1", clientNom: "ACME", objet: "Entreposage", dateDebut: "2026-01-01", montant: 0, statut: "Actif", creeLe: "2026-01-01" },
    ];
    const [updated] = syncContratStats([], [], contrats);
    expect(updated.nbPrestations).toBe(0);
    expect(updated.nbPrestationsRealisees).toBe(0);
    expect(updated.totalDepenses).toBe(0);
  });

  it("compte les prestations réalisées et somme les dépenses pour le bon contrat", () => {
    const contrats: BaseContrat[] = [
      { id: "c1", reference: "CTR-2026-0001", societeId: "s1", societeNom: "Top Doumani", clientId: "cl1", clientNom: "ACME", objet: "Entreposage", dateDebut: "2026-01-01", montant: 0, statut: "Actif", creeLe: "2026-01-01" },
      { id: "c2", reference: "CTR-2026-0002", societeId: "s2", societeNom: "Traoré Transit Logistique", clientId: "cl2", clientNom: "Autre", objet: "Entreposage", dateDebut: "2026-01-01", montant: 0, statut: "Actif", creeLe: "2026-01-01" },
    ];
    const prestations: ContratPrestation[] = [
      { id: "p1", contratId: "c1", libelle: "A", statut: "Réalisée" },
      { id: "p2", contratId: "c1", libelle: "B", statut: "Prévue" },
      { id: "p3", contratId: "c1", libelle: "C", statut: "Réalisée" },
      { id: "p4", contratId: "c2", libelle: "D", statut: "Réalisée" },
    ];
    const depenses: Depense[] = [
      { id: "d1", contratId: "c1", societeId: "s1", libelle: "Transport", montant: 1000, dateDepense: "2026-01-05", modePaiement: "Espèces" },
      { id: "d2", contratId: "c1", societeId: "s1", libelle: "Manutention", montant: 500, dateDepense: "2026-01-06", modePaiement: "Virement" },
      { id: "d3", contratId: "c2", societeId: "s2", libelle: "Autre", montant: 200, dateDepense: "2026-01-07", modePaiement: "Espèces" },
    ];

    const result = syncContratStats(depenses, prestations, contrats);
    const c1 = result.find((c) => c.id === "c1")!;
    const c2 = result.find((c) => c.id === "c2")!;

    expect(c1.nbPrestations).toBe(3);
    expect(c1.nbPrestationsRealisees).toBe(2);
    expect(c1.totalDepenses).toBe(1500);

    expect(c2.nbPrestations).toBe(1);
    expect(c2.nbPrestationsRealisees).toBe(1);
    expect(c2.totalDepenses).toBe(200);
  });
});
