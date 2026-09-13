import { describe, expect, it } from "vitest";

import { shouldShowTva } from "./export";

import {

  normalizeExportCell,

  normalizeExportRows,

} from "./export/normalize-export-cell";

import { sanitizeExcelCell } from "./export/xlsx-cell-utils";



describe("normalizeExportCell", () => {

  it("normalise null, undefined, NaN et booléens", () => {

    expect(normalizeExportCell(null)).toBe("");

    expect(normalizeExportCell(undefined)).toBe("");

    expect(normalizeExportCell(Number.NaN)).toBe("");

    expect(normalizeExportCell(true)).toBe("Oui");

    expect(normalizeExportCell(false)).toBe("Non");

  });



  it("normalise les dates et conserve les nombres finis", () => {

    expect(normalizeExportCell(new Date("2026-07-23T12:00:00Z"))).toBe(

      "2026-07-23",

    );

    expect(normalizeExportCell(42)).toBe(42);

  });



  it("normalise les lignes avec padding de colonnes", () => {

    expect(normalizeExportRows([[null, true], ["x"]], 3)).toEqual([

      ["", "Oui", ""],

      ["x", "", ""],

    ]);

  });

});



describe("sanitizeExcelCell", () => {

  it("neutralise l'injection de formule Excel (=, +, -, @)", () => {

    expect(sanitizeExcelCell("=CMD(calc)")).toBe("'=CMD(calc)");

    expect(sanitizeExcelCell("+223 00 00 00")).toBe("'+223 00 00 00");

    expect(sanitizeExcelCell("-1+1")).toBe("'-1+1");

    expect(sanitizeExcelCell("@SUM(A1)")).toBe("'@SUM(A1)");

  });



  it("conserve les nombres finis", () => {

    expect(sanitizeExcelCell(42)).toBe(42);

    expect(sanitizeExcelCell(0)).toBe(0);

  });

});



describe("shouldShowTva", () => {

  it("masque la ligne TVA quand le taux est 0 (F2 — TVA optionnelle)", () => {

    expect(shouldShowTva(0)).toBe(false);

  });



  it("affiche la ligne TVA pour un taux positif", () => {

    expect(shouldShowTva(18)).toBe(true);

  });

});


