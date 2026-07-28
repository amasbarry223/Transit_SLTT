import { describe, expect, it } from "vitest";
import {
  canTransitionContrat,
  canTransitionDevis,
  canTransitionFacture,
  CONTRAT_ALLOWED_TRANSITIONS,
  DEVIS_ALLOWED_TRANSITIONS,
  FACTURE_ALLOWED_TRANSITIONS,
} from "@/lib/status-flow";
import { assertDossierTransition, getNextDossierStatut } from "@/lib/dossier-flow";

describe("status-flow FSM", () => {
  it("refuse les transitions devis interdites", () => {
    expect(canTransitionDevis("Accepté", "Brouillon")).toBe(false);
    expect(canTransitionDevis("Brouillon", "Envoyé")).toBe(true);
    expect(canTransitionDevis("Envoyé", "Accepté")).toBe(true);
  });

  it("refuse Soldée → Partielle", () => {
    expect(canTransitionFacture("Soldée", "Partielle")).toBe(false);
    expect(canTransitionFacture("Envoyée", "Partielle")).toBe(true);
  });

  it("matrice contrat alignée DB", () => {
    expect(canTransitionContrat("Actif", "Clôturé")).toBe(true);
    expect(canTransitionContrat("Clôturé", "Suspendu")).toBe(false);
    expect(canTransitionContrat("Suspendu", "Actif")).toBe(true);
    expect(CONTRAT_ALLOWED_TRANSITIONS.Actif).toEqual(["Suspendu", "Clôturé"]);
  });

  it("couvre toutes les clés devis/facture", () => {
    expect(Object.keys(DEVIS_ALLOWED_TRANSITIONS).sort()).toEqual(
      ["Accepté", "Brouillon", "Envoyé", "Expiré", "Refusé"].sort(),
    );
    expect(Object.keys(FACTURE_ALLOWED_TRANSITIONS)).toContain("Annulée");
  });
});

describe("dossier-flow", () => {
  it("enchaîne linéairement", () => {
    expect(getNextDossierStatut("En cours")).toBe("Dédouané");
    expect(getNextDossierStatut("Soldé")).toBeNull();
  });

  it("assert refuse les sauts", () => {
    expect(() => assertDossierTransition("En cours", "Livré")).toThrow(/Transition invalide/);
    expect(() => assertDossierTransition("En cours", "Dédouané")).not.toThrow();
  });
});
