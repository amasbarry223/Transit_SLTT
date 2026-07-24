import ExcelJS from "exceljs";

import { describe, expect, it } from "vitest";

import { shouldShowTva } from "./export";

import {

  normalizeExportCell,

  normalizeExportRows,

} from "./export/normalize-export-cell";

import { buildXlsxBuffer, sanitizeExcelCell } from "./export/xlsx-builder";



function isValidXlsxBytes(bytes: Uint8Array): boolean {

  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;

}



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



describe("buildXlsxBuffer", () => {

  const headers = ["Société", "Contact", "Montant"];

  const rows: (string | number)[][] = [

    ["Konaté Transport", "Mamadou Konaté", 150000],

    ["Golaine Tech", "Ibrahim Diarra", 82000],

  ];



  it("produit un buffer non vide avec signature ZIP PK", async () => {

    const buffer = await buildXlsxBuffer(headers, rows);

    expect(buffer.length).toBeGreaterThan(0);

    expect(isValidXlsxBytes(buffer)).toBe(true);

  });



  it("contient les en-têtes et les données", async () => {

    const buffer = await buildXlsxBuffer(headers, rows);

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);



    const sheet = workbook.getWorksheet("Export");

    expect(sheet).toBeDefined();

    expect(sheet?.getCell("A1").value).toBe("Société");

    expect(sheet?.getCell("B1").value).toBe("Contact");

    expect(sheet?.getCell("A2").value).toBe("Konaté Transport");

    expect(sheet?.getCell("B2").value).toBe("Mamadou Konaté");

    expect(sheet?.getCell("C2").value).toBe(150000);

  });



  it("neutralise les formules dans les cellules exportées", async () => {

    const buffer = await buildXlsxBuffer(["Nom"], [["=CMD(calc)"]]);

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);



    const sheet = workbook.getWorksheet("Export");

    expect(sheet?.getCell("A2").value).toBe("'=CMD(calc)");

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


