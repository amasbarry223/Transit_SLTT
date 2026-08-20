import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { parseStockBulkXlsx } from "./stock-bulk-import";

/** Reproduit le format maison : une feuille par article, en-tête Dates | Désignation | … | Entrée | Sortie | Stocks. */
async function buildSampleWorkbook(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Cube Top Doumani");
  sheet.addRow(["GESTION DE STOCKS TOP DOUMANI"]);
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
    expect(groups[0].articleNomSuggere).toBe("Cube Top Doumani");
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

  it("reproduit le fichier réel « Gestion de stock top doumani.md » : 226 lignes, stock final 1408, 10 dates corrigées par le voisinage", async () => {
    const mdPath = path.resolve(__dirname, "../../Gestion de stock top doumani.md");
    const md = fs.readFileSync(mdPath, "utf8");
    const dataLines = md
      .split(/\r?\n/)
      .filter((l) => l.trim().startsWith("|"))
      .slice(2);

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Cube Top Doumani");
    sheet.addRow(["GESTION DE STOCKS TOP DOUMANI"]);
    sheet.addRow([]);
    sheet.addRow(["DATES", "DESIGNATION", "QUANTITE", "ENTREE", "SORTIE", "STOCKS"]);
    for (const line of dataLines) {
      const [dates, designation, quantite, entree, sortie, stocks] = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      sheet.addRow([
        dates,
        designation,
        quantite ? Number(quantite) : "",
        entree ? Number(entree) : "",
        sortie ? Number(sortie) : "",
        stocks ? Number(stocks) : "",
      ]);
    }
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const groups = await parseStockBulkXlsx(buf);
    expect(groups).toHaveLength(1);
    expect(groups[0].rows).toHaveLength(226);
    expect(groups[0].rows.at(-1)!.stockCalcule).toBe(1408);

    const invalidDates = groups[0].rows.filter((r) => r.warnings.some((w) => w.includes("Date illisible")));
    expect(invalidDates).toHaveLength(4);

    const horsSequence = groups[0].rows.filter((r) => r.warnings.some((w) => w.includes("Date hors séquence")));
    expect(horsSequence).toHaveLength(6);

    const suggested = Object.fromEntries(
      groups[0].rows
        .filter((r) => r.dateSuggested)
        .map((r) => [`${r.dateRaw}|${r.designation}`, r.dateSuggested]),
    );
    expect(suggested).toMatchObject({
      "30/01/2025|KOITA MANQUANT": "2025-12-30",
      "03/12/2026|MAHAMADOU SANGARE": "2026-01-03",
      "09/01/2025|KOITA BOULKASS": "2026-01-09",
      "22/101/2026|KOITA DJALAKORODJI": "2026-01-22",
      "03/05/2026|Mahamadou Sangare": "2026-06-03",
      "10/01/2026|KOITA MISSIRA": "2026-06-10",
      "19/05/2026|Mahamadou sangare": "2026-06-19",
      "23/062026|Modibo Coulibaly": "2026-06-23",
      "30/062026|KOITA MISSIRA": "2026-06-30",
      "30/07/02026|Sangare regions": "2026-07-30",
    });
    expect(Object.keys(suggested)).toHaveLength(10);
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
});
