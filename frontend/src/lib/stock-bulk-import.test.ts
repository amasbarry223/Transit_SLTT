import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseStockBulkXlsx } from "./stock-bulk-import";

/** Reproduit le format maison : une feuille par article, en-tête Dates | Désignation | … | Entrée | Sortie | Stocks. */
async function buildSampleWorkbook(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Riz parfumé 25 kg");
  sheet.addRow(["GESTION DE STOCKS"]);
  sheet.addRow([]);
  sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE", "SORTIE", "STOCKS"]);
  sheet.addRow(["26/11/2025", "STOCK INITIAL", "100", "100", "", "100"]);
  sheet.addRow(["26/11/2025", "AMI KOUMA", "20", "", "20", "80"]);
  return (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}

describe("parseStockBulkXlsx", () => {
  it("détecte l'article depuis le nom de feuille, pas depuis le titre en ligne 1", async () => {
    const groups = await parseStockBulkXlsx(await buildSampleWorkbook());
    expect(groups).toHaveLength(1);
    expect(groups[0].articleNomSuggere).toBe("Riz parfumé 25 kg");
  });

  it("distingue Entrée/Sortie par colonne et calcule le solde courant", async () => {
    const groups = await parseStockBulkXlsx(await buildSampleWorkbook());
    const [entree, sortie] = groups[0].rows;
    expect(entree).toMatchObject({ date: "2025-11-26", type: "Entrée", quantite: 100, stockCalcule: 100 });
    expect(sortie).toMatchObject({ date: "2025-11-26", type: "Sortie", quantite: 20, stockCalcule: 80 });
    expect(entree.warnings).toHaveLength(0);
    expect(sortie.warnings).toHaveLength(0);
  });

  it("signale un stock déclaré incohérent avec le calcul", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Riz");
    sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE", "SORTIE", "STOCKS"]);
    sheet.addRow(["01/01/2026", "STOCK INITIAL", "50", "50", "", "999"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    expect(groups[0].rows[0].warnings.some((w) => w.includes("≠ calculé"))).toBe(true);
  });

  it("signale une ligne avec Entrée et Sortie toutes deux renseignées comme ambiguë", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Riz");
    sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE", "SORTIE", "STOCKS"]);
    sheet.addRow(["01/01/2026", "?", "50", "50", "20", "80"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    expect(groups[0].rows[0].type).toBeNull();
    expect(groups[0].rows[0].warnings).toContain("Entrée et Sortie renseignées sur la même ligne — ambigu");
  });

  it("signale une date syntaxiquement invalide sans bloquer les autres lignes", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Riz");
    sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE", "SORTIE", "STOCKS"]);
    sheet.addRow(["23/062026", "Modibo Coulibaly", "5", "", "5", "32"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    expect(groups[0].rows[0].date).toBe("");
    expect(groups[0].rows[0].warnings.some((w) => w.includes("Date illisible"))).toBe(true);
  });

  it("ignore une feuille sans en-tête reconnaissable", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Notes");
    sheet.addRow(["Ceci n'est pas un grand livre"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    expect(groups).toHaveLength(0);
  });

  it("signale une date lisible mais hors séquence et propose la correction des voisins", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Riz");
    sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE", "SORTIE", "STOCKS"]);
    sheet.addRow(["01/06/2026", "A", "1", "1", "", "1"]);
    sheet.addRow(["02/06/2026", "B", "1", "", "1", "0"]);
    sheet.addRow(["03/05/2026", "C", "1", "1", "", "1"]);
    sheet.addRow(["04/06/2026", "D", "1", "", "1", "0"]);
    sheet.addRow(["05/06/2026", "E", "1", "1", "", "1"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    const outlier = groups[0].rows.find((r) => r.designation === "C");
    expect(outlier?.date).toBe("2026-05-03");
    expect(outlier?.dateSuggested).toBe("2026-06-03");
    expect(outlier?.warnings.some((w) => w.includes("Date hors séquence"))).toBe(true);
    expect(groups[0].rows.filter((r) => r.dateSuggested)).toHaveLength(1);
  });

  it("déduit Entrée/Sortie d'un registre sans colonne Sortie (Quantité + Entrée seulement)", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Riz parfumé 25 kg");
    sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE"]);
    sheet.addRow(["26/11/2025", "STOCK INITIAL", "100", "100"]);
    sheet.addRow(["26/11/2025", "AMI KOUMA", "20", ""]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    const [entree, sortie] = groups[0].rows;
    expect(entree).toMatchObject({ type: "Entrée", quantite: 100, stockCalcule: 100 });
    expect(sortie).toMatchObject({ type: "Sortie", quantite: 20, stockCalcule: 80 });
    expect(entree.warnings).toHaveLength(0);
    expect(sortie.warnings).toHaveLength(0);
  });

  it("signale une incohérence Quantité/Entrée sur une ligne d'entrée", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Riz");
    sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE"]);
    sheet.addRow(["01/01/2026", "STOCK INITIAL", "90", "100"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    expect(groups[0].rows[0]).toMatchObject({ type: "Entrée", quantite: 100 });
    expect(groups[0].rows[0].warnings.some((w) => w.includes("≠ Entrée"))).toBe(true);
  });
});
