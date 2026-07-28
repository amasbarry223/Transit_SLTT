import { describe, expect, it } from "vitest";
import {
  mapDossierFieldsFromText,
  normalizeDate,
  parseMontant,
} from "@/lib/documents/ocr/mappers/dossier-mapper";

describe("normalizeDate", () => {
  it("convertit DD/MM/YYYY", () => {
    expect(normalizeDate("15/03/2026")).toBe("2026-03-15");
  });

  it("refuse une date invalide", () => {
    expect(normalizeDate("32/13/2026")).toBeNull();
    expect(normalizeDate("00/01/2026")).toBeNull();
  });

  it("accepte ISO", () => {
    expect(normalizeDate("2026-07-01")).toBe("2026-07-01");
  });
});

describe("parseMontant", () => {
  it("parse FR avec espaces et virgule", () => {
    expect(parseMontant("1 250 000")).toBe(1_250_000);
    expect(parseMontant("1.250.000,50")).toBe(1_250_001);
  });

  it("ne renvoie pas 0 pour un texte non numérique", () => {
    expect(parseMontant("abc")).toBeNull();
    expect(parseMontant("")).toBeNull();
  });
});

describe("mapDossierFieldsFromText", () => {
  it("extrait BL et ignore montant invalide", () => {
    const fields = mapDossierFieldsFromText(
      "BL: ABC12345\nDate: 01/02/2026\nMontant: xyz\nClient: Konaté Transport",
    );
    expect(fields.find((f) => f.fieldKey === "bl")?.fieldValue).toBe("ABC12345");
    expect(fields.find((f) => f.fieldKey === "date")?.fieldValue).toBe("2026-02-01");
    expect(fields.find((f) => f.fieldKey === "montant")).toBeUndefined();
  });
});
