import { describe, expect, it } from "vitest";
import {
  LEGACY_TRANSIT_SOCIETE_ID,
  resolveTransitSociete,
  resolveDossierCoutLabels,
} from "@/lib/societe-brand";
import type { Societe } from "@/lib/domain-types";

function societe(overrides: Partial<Societe> & { id: string }): Societe {
  return {
    nom: `Société ${overrides.id}`,
    actif: true,
    afficherNomAvecLogo: true,
    ...overrides,
  };
}

describe("resolveTransitSociete", () => {
  it("priorise la société flaguée is_transit", () => {
    const a = societe({ id: "a" });
    const b = societe({ id: "b", isTransit: true });
    expect(resolveTransitSociete([a, b])).toBe(b);
  });

  it("retombe sur l'UUID legacy si aucun flag is_transit", () => {
    const a = societe({ id: "a" });
    const legacy = societe({ id: LEGACY_TRANSIT_SOCIETE_ID });
    expect(resolveTransitSociete([a, legacy])).toBe(legacy);
  });

  it("retombe sur l'unique société active si aucune ambiguïté", () => {
    const seule = societe({ id: "a" });
    expect(resolveTransitSociete([seule])).toBe(seule);
  });

  it("ne devine pas parmi plusieurs sociétés actives non flaguées", () => {
    const a = societe({ id: "a" });
    const b = societe({ id: "b" });
    expect(resolveTransitSociete([a, b])).toBeUndefined();
  });
});

describe("resolveDossierCoutLabels", () => {
  it("utilise le triptyque Mali par défaut (sans code annexe ou code ML)", () => {
    expect(resolveDossierCoutLabels().droitDouane).toBe("Droit de douane");
    expect(resolveDossierCoutLabels(null).fraisCircuit).toBe("Frais de circuit global");
    expect(resolveDossierCoutLabels("ML").droitDouane).toBe("Droit de douane");
  });

  it("remplace les rubriques par le modèle transit portuaire pour l'annexe CI", () => {
    const labels = resolveDossierCoutLabels("CI");
    expect(labels.droitDouane).toBe("Frais transit port");
    expect(labels.fraisCircuit).toBe("Dépenses");
    // La prestation SLTT reste la même quelle que soit l'annexe.
    expect(labels.fraisPrestation).toBe("Frais de prestation");
  });
});
