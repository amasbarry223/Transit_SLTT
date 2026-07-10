import { describe, expect, it } from "vitest";
import { assertDossierTransition, DOSSIER_STATUT_FLOW, getNextDossierStatut } from "./dossier-flow";

describe("dossier-flow", () => {
  it("définit un flux linéaire En cours → Soldé", () => {
    expect(getNextDossierStatut("En cours")).toBe("Dédouané");
    expect(getNextDossierStatut("Dédouané")).toBe("Livré");
    expect(getNextDossierStatut("Livré")).toBe("Soldé");
    expect(getNextDossierStatut("Soldé")).toBeNull();
  });

  it("rejette les transitions invalides", () => {
    expect(() => assertDossierTransition("En cours", "Soldé")).toThrow(/Transition invalide/);
    expect(() => assertDossierTransition("En cours", "Dédouané")).not.toThrow();
  });

  it("expose le graphe de transitions", () => {
    expect(DOSSIER_STATUT_FLOW["Livré"]).toBe("Soldé");
  });
});
