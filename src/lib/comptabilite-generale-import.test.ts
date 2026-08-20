import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseComptabiliteGeneraleXlsx, parseSourceDate } from "@/lib/comptabilite-generale-import";

async function workbookToBuffer(build: (wb: ExcelJS.Workbook) => void): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  build(wb);
  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

describe("parseSourceDate", () => {
  it("accepte JJ/MM/AAAA", () => {
    expect(parseSourceDate("12/01/2026")).toBe("2026-01-12");
  });

  it("accepte un ISO déjà normalisé (cellule Date Excel)", () => {
    expect(parseSourceDate("2026-03-31")).toBe("2026-03-31");
  });

  it("rejette une année à 3 chiffres (coquille '31/03/265') sans la recaler", () => {
    expect(parseSourceDate("31/03/265")).toBeNull();
  });

  it("rejette un jour/mois hors plage", () => {
    expect(parseSourceDate("32/13/2026")).toBeNull();
  });

  it("rejette une chaîne vide", () => {
    expect(parseSourceDate("")).toBeNull();
  });
});

describe("parseComptabiliteGeneraleXlsx", () => {
  it("reconnaît les en-têtes SLTT et sépare Entrée/Sortie", async () => {
    const buf = await workbookToBuffer((wb) => {
      const sheet = wb.addWorksheet("SLTT");
      sheet.addRow(["Dates", "Clients", "Nature de la depenses", "Entrée", "Sortie"]);
      sheet.addRow(["10/02/2026", "HAMADOU DIALLO", "REMBOURSEMENT DE LA PRESTATION", 36800000, ""]);
      sheet.addRow(["12/01/2026", "DOUNIYA INFORM ELECTRO", "ACHAT DE MATERIEL", "", 555000]);
    });

    const rows = await parseComptabiliteGeneraleXlsx(buf, { entiteType: "annexe" });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: "2026-02-10", type: "Entrée", montant: 36800000, warnings: [] });
    expect(rows[1]).toMatchObject({ date: "2026-01-12", type: "Sortie", montant: 555000, warnings: [] });
  });

  it("signale une date illisible sans la corriger automatiquement", async () => {
    const buf = await workbookToBuffer((wb) => {
      const sheet = wb.addWorksheet("SLTT");
      sheet.addRow(["Dates", "Clients", "Nature de la depenses", "Entrée", "Sortie"]);
      sheet.addRow(["31/03/265", "MAHAMADOU KAMISSOKO", "FRAIS DE PRESTATION", "", 100000]);
    });

    const rows = await parseComptabiliteGeneraleXlsx(buf, { entiteType: "annexe" });
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBeNull();
    expect(rows[0].warnings.some((w) => w.includes("illisible"))).toBe(true);
  });

  it("calcule le montant Top Doumani à partir de Quantité × Prix unitaire", async () => {
    const buf = await workbookToBuffer((wb) => {
      const sheet = wb.addWorksheet("TOP DOUMANI");
      sheet.addRow(["Dates", "Clients", "Nature de la depenses", "Quantité", "Prix unitaire"]);
      sheet.addRow(["01/02/2026", "Client X", "Vente ciment", 50, 5000]);
    });

    const rows = await parseComptabiliteGeneraleXlsx(buf, { entiteType: "societe" });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "Sortie", montant: 250000, quantite: 50, prixUnitaire: 5000 });
  });

  it("signale un montant manquant sans insérer 0 silencieusement", async () => {
    const buf = await workbookToBuffer((wb) => {
      const sheet = wb.addWorksheet("SLTT");
      sheet.addRow(["Dates", "Clients", "Nature de la depenses", "Entrée", "Sortie"]);
      sheet.addRow(["05/02/2026", "LASSINA TRAORE", "PRISE EN CHARGE DU CONTENEUR", "", ""]);
    });

    const rows = await parseComptabiliteGeneraleXlsx(buf, { entiteType: "annexe" });
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBeNull();
    expect(rows[0].warnings).toContain("Montant manquant (Entrée / Sortie / Quantité × PU)");
  });

  it("ignore les lignes totalement vides (espaceurs entre mois)", async () => {
    const buf = await workbookToBuffer((wb) => {
      const sheet = wb.addWorksheet("SLTT");
      sheet.addRow(["Dates", "Clients", "Nature de la depenses", "Entrée", "Sortie"]);
      sheet.addRow(["10/02/2026", "HAMADOU DIALLO", "REMBOURSEMENT", 1000, ""]);
      sheet.addRow(["", "", "", "", ""]);
      sheet.addRow(["12/02/2026", "Kalilou Coulibaly", "VERSEMENT BCI", "", 2000]);
    });

    const rows = await parseComptabiliteGeneraleXlsx(buf, { entiteType: "annexe" });
    expect(rows).toHaveLength(2);
  });

  it("lit toutes les feuilles du classeur, pas seulement la première (bug réel : un onglet par mois au-delà du premier disparaissait silencieusement)", async () => {
    const buf = await workbookToBuffer((wb) => {
      const janvier = wb.addWorksheet("Janvier");
      janvier.addRow(["Dates", "Clients", "Nature de la depenses", "Entrée", "Sortie"]);
      janvier.addRow(["10/01/2026", "HAMADOU DIALLO", "REMBOURSEMENT", 1000, ""]);

      const fevrier = wb.addWorksheet("Février");
      fevrier.addRow(["Dates", "Clients", "Nature de la depenses", "Entrée", "Sortie"]);
      fevrier.addRow(["10/02/2026", "Kalilou Coulibaly", "VERSEMENT BCI", "", 2000]);
    });

    const rows = await parseComptabiliteGeneraleXlsx(buf, { entiteType: "annexe" });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.date)).toEqual(["2026-01-10", "2026-02-10"]);
  });

  it("lève une erreur seulement si AUCUNE feuille n'a d'en-tête reconnu", async () => {
    const buf = await workbookToBuffer((wb) => {
      wb.addWorksheet("Notes").addRow(["Rien d'exploitable ici"]);
    });

    await expect(parseComptabiliteGeneraleXlsx(buf, { entiteType: "annexe" })).rejects.toThrow(
      /En-têtes Excel non reconnus/,
    );
  });
});
