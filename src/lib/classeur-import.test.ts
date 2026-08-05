import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseClasseurXlsx, planClasseurImport } from "@/lib/classeur-import";
import { GRAND_LIVRE_HEADERS } from "@/lib/excel/template";

async function workbookToBuffer(
  build: (wb: ExcelJS.Workbook) => void,
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  build(wb);
  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

describe("parseClasseurXlsx", () => {
  it("reconnaît les en-têtes GrandLivre SLTT", async () => {
    const buf = await workbookToBuffer((wb) => {
      const sheet = wb.addWorksheet("GrandLivre");
      sheet.addRow([...GRAND_LIVRE_HEADERS]);
      sheet.addRow(["2026-01-15", "SLTT", "Dossier", "REF-1", "Test", 1000, 200, "En cours", 800]);
    });

    const rows = await parseClasseurXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      reference: "REF-1",
      debit: 1000,
      credit: 200,
      type: "Dossier",
    });
  });

  it("reconnaît richText et feuille Notes en premier", async () => {
    const buf = await workbookToBuffer((wb) => {
      wb.addWorksheet("Notes").addRow(["ignore"]);
      const sheet = wb.addWorksheet("GrandLivre");
      const header = sheet.addRow(["Date", "Société", "Type", "Référence", "Libellé", "Débit", "Crédit", "Statut", "Solde"]);
      header.getCell(1).value = { richText: [{ text: "Date" }] };
      sheet.addRow(["2026-02-01", "X", "Paiement", "ÉCR-ABC", "Note", 0, 500, "Payé", 0]);
    });

    const rows = await parseClasseurXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].reference).toBe("ÉCR-ABC");
    expect(rows[0].credit).toBe(500);
  });

  it("accepte une grille dense sans en-têtes reconnus (fallback positionnel)", async () => {
    const buf = await workbookToBuffer((wb) => {
      const sheet = wb.addWorksheet("Export");
      sheet.addRow(["Col1", "Col2", "Col3", "Col4", "Col5", "Col6", "Col7", "Col8"]);
      sheet.addRow(["2026-04-01", "Z", "Dossier", "D-99", "Marchandise", 120, 0, "Ouvert"]);
    });

    const rows = await parseClasseurXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].reference).toBe("D-99");
    expect(rows[0].debit).toBe(120);
  });
});

describe("planClasseurImport", () => {
  it("matche une référence malgré une différence d'accent/casse (ÉCR vs ECR)", () => {
    const plan = planClasseurImport(
      [
        {
          date: "2026-02-01",
          societeNom: "SLTT",
          type: "Paiement",
          reference: "ECR-ABCDEF01",
          libelle: "Paiement",
          debit: 0,
          credit: 500,
          statut: "Payé",
          rowNumber: 2,
        },
      ],
      [{ type: "Paiement", sourceId: "ecriture-1", reference: "ÉCR-ABCDEF01" }],
    );

    expect(plan.unmatched).toHaveLength(0);
    expect(plan.updates).toEqual([
      { sourceType: "Paiement", sourceId: "ecriture-1", debit: 0, credit: 500, libelle: "Paiement" },
    ]);
  });
});
