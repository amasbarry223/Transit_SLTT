import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildXlsxBlob } from "./build-xlsx-client";

async function loadWorkbook(blob: Blob) {
  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.from(await blob.arrayBuffer());
  await workbook.xlsx.load(buffer as unknown as never);
  return workbook;
}

describe("buildXlsxBlob", () => {
  const headers = ["Société", "Contact", "Montant"];
  const rows: (string | number)[][] = [
    ["Konaté Transport", "Mamadou Konaté", 150000],
    ["Golaine Tech", "Ibrahim Diarra", 82000],
  ];

  it("produit un blob .xlsx non vide et réouvrable", async () => {
    const blob = await buildXlsxBlob(headers, rows);
    expect(blob.size).toBeGreaterThan(0);

    const workbook = await loadWorkbook(blob);
    const sheet = workbook.getWorksheet("Export");
    expect(sheet).toBeDefined();
    expect(sheet?.getCell("A1").value).toBe("Société");
    expect(sheet?.getCell("B1").value).toBe("Contact");
    expect(sheet?.getCell("A2").value).toBe("Konaté Transport");
    expect(sheet?.getCell("B2").value).toBe("Mamadou Konaté");
    expect(sheet?.getCell("C2").value).toBe(150000);
  });

  it("neutralise les formules dans les cellules exportées", async () => {
    const blob = await buildXlsxBlob(["Nom"], [["=CMD(calc)"]]);
    const workbook = await loadWorkbook(blob);
    const sheet = workbook.getWorksheet("Export");
    expect(sheet?.getCell("A2").value).toBe("'=CMD(calc)");
  });
});
