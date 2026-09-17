import { describe, expect, it } from "vitest";
import { buildCoteIvoireFactureHTML, type FactureModuleData } from "./facture";
import type { SocieteBrand } from "@/lib/societe-brand";

function baseData(overrides: Partial<FactureModuleData> = {}): FactureModuleData {
  return {
    numero: "F-0001",
    clientNom: "Client Test",
    date: "2026-01-01",
    dateEcheance: "2026-01-31",
    lignes: [],
    tauxTVA: 0,
    montantHT: 0,
    montantTVA: 0,
    montantTTC: 0,
    montantPaye: 0,
    notes: "",
    genereParNom: "Testeur",
    isCoteIvoire: true,
    ...overrides,
  };
}

describe("buildCoteIvoireFactureHTML — échappement du logo (sécurité)", () => {
  it("échappe un logoUrl malveillant au lieu de l'injecter tel quel dans le <img src>", () => {
    const brand: SocieteBrand = {
      nom: "Société Test",
      logoUrl: '"><script>alert(1)</script>',
    };

    const html = buildCoteIvoireFactureHTML(baseData(), brand);

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("affiche un logoUrl légitime normalement", () => {
    const brand: SocieteBrand = {
      nom: "Société Test",
      logoUrl: "https://example.com/logo.png",
    };

    const html = buildCoteIvoireFactureHTML(baseData(), brand);

    expect(html).toContain('src="https://example.com/logo.png"');
  });
});
