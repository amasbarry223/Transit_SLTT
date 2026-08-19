import { describe, expect, it } from "vitest";
import { splitRaisonSocialeLines } from "./print-document";

describe("splitRaisonSocialeLines", () => {
  it("découpe Traoré de Logistique Transit-Transport sur 3 lignes", () => {
    expect(splitRaisonSocialeLines("Traoré de Logistique Transit-Transport")).toEqual([
      "Traoré de",
      "Logistique",
      "Transit-Transport",
    ]);
  });

  it("respecte les retours à la ligne explicites", () => {
    expect(splitRaisonSocialeLines("Ligne A\nLigne B\nLigne C")).toEqual([
      "Ligne A",
      "Ligne B",
      "Ligne C",
    ]);
  });
});
