import { describe, expect, it } from "vitest";
import { LEGACY_TRANSIT_SOCIETE_ID, resolveTransitSociete } from "@/lib/societe-brand";
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
