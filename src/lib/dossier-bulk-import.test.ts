import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseDossierBulkXlsx } from "./dossier-bulk-import";

/** Reproduit le format maison : « Situation du Client X », en-tête dupliqué, montants « 18 200 000 ». */
async function buildSampleWorkbook(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("LASSINA TRAORE");
  sheet.addRow(["Situation du Client LASSINA TRAORE"]);
  sheet.addRow([]);
  sheet.addRow(["2025"]);
  sheet.addRow([
    "Date", "Nature de la M/se", "Quantité", "facture N°",
    "Total investi", "Montant payé", "Reste a payer", "Benefice net",
    "Date", "Nature de la M/se", "Quantité", "facture N°",
    "Total investi", "Montant payé", "Reste a payer", "Benefice net",
  ]);
  sheet.addRow(["05/02/2026", "FRIPPERIE", "1", "", "18 200 000", "", "", ""]);
  sheet.addRow(["20/02/2026", "FRIPPERIE", "1", "", "18 200 000", "12 250 000", "5 950 000", ""]);
  return (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}

describe("parseDossierBulkXlsx", () => {
  it("extrait le nom du client depuis le titre de la feuille", async () => {
    const rows = await parseDossierBulkXlsx(await buildSampleWorkbook());
    expect(rows.every((r) => r.clientNom === "LASSINA TRAORE")).toBe(true);
  });

  it("ne lit que le premier bloc d'en-têtes rempli (le second, vide, ne produit rien)", async () => {
    const rows = await parseDossierBulkXlsx(await buildSampleWorkbook());
    expect(rows).toHaveLength(2);
  });

  it("parse dates, montants et calcule le reste à payer", async () => {
    const rows = await parseDossierBulkXlsx(await buildSampleWorkbook());
    expect(rows[0]).toMatchObject({
      date: "2026-02-05",
      nature: "FRIPPERIE",
      montantInvesti: 18_200_000,
      montantPaye: 0,
    });
    expect(rows[1]).toMatchObject({
      date: "2026-02-20",
      montantInvesti: 18_200_000,
      montantPaye: 12_250_000,
      resteAPayerFichier: 5_950_000,
    });
    expect(rows[1].warnings).toHaveLength(0);
  });

  it("signale un reste à payer du fichier incohérent avec le calcul", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("X");
    sheet.addRow(["Situation du Client X"]);
    sheet.addRow(["Date", "Nature de la M/se", "Quantité", "facture N°", "Total investi", "Montant payé", "Reste a payer", "Benefice net"]);
    sheet.addRow(["01/01/2026", "CONTENEUR", "1", "F1", "1 000 000", "400 000", "999 999", ""]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const rows = await parseDossierBulkXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].warnings.some((w) => w.includes("≠ calculé"))).toBe(true);
  });

  it("ignore une feuille sans titre client reconnaissable ni nom de feuille exploitable", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Sheet1");
    sheet.addRow(["Date", "Nature de la M/se", "Quantité", "facture N°", "Total investi", "Montant payé", "Reste a payer", "Benefice net"]);
    sheet.addRow(["01/01/2026", "CONTENEUR", "1", "", "1 000 000", "", "", ""]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const rows = await parseDossierBulkXlsx(buf);
    expect(rows).toHaveLength(0);
  });

  it("ne signale pas une ligne « versement » (investi nul, payé renseigné) comme incomplète", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("X");
    sheet.addRow(["Situation du Client X"]);
    sheet.addRow(["Date", "Nature de la M/se", "Quantité", "facture N°", "Total investi", "Montant payé", "Reste a payer", "Benefice net"]);
    sheet.addRow(["21/05/2026", "", "", "", "", "2 500 000", "", ""]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const rows = await parseDossierBulkXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      isPaiementSeul: true,
      montantInvesti: 0,
      montantPaye: 2_500_000,
    });
    expect(rows[0].warnings).toHaveLength(0);
  });

  it("lit le Reste à payer par libellé même quand le Bénéfice net le précède dans le bloc", async () => {
    // Cas réel observé : certains clients ont "... | Montant payé | Benefice | Reste a payer"
    // au lieu de "... | Montant payé | Reste a payer | Benefice net" — une lecture positionnelle
    // fixe après "Montant payé" lirait alors le bénéfice à la place du reste.
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("AMADOU DEMBELE");
    sheet.addRow(["bina DEMBELE"]);
    sheet.addRow([]);
    sheet.addRow(["Janvier"]);
    sheet.addRow([
      "Date", "Nature de la M/se", "Quantité", "facture N°", "Total investi", "Montant payé", "Benefice", "Reste a payer",
    ]);
    sheet.addRow(["28/03/2026", "Machine", "", "", "12 500 000", "10 000 000", "1 700 000", "2 500 000"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const rows = await parseDossierBulkXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      montantInvesti: 12_500_000,
      montantPaye: 10_000_000,
      resteAPayerFichier: 2_500_000,
    });
    // Le reste calculé (2 500 000) doit correspondre au reste lu — pas d'alerte de faux écart.
    expect(rows[0].warnings).toHaveLength(0);
  });

  it("reconnaît « Situation de la Cliente X » (variante féminine du titre)", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Ba diallo");
    sheet.addRow(["Situation de la Cliente ba Diallo"]);
    sheet.addRow(["Date", "Nature de la M/se", "Quantité", "facture N°", "Total investi", "Montant payé", "Reste a payer", "Benefice net"]);
    sheet.addRow(["02/05/2026", "Meubles ci", "1", "", "3 750 000", "", "", "450 000"]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const rows = await parseDossierBulkXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].clientNom).toBe("ba Diallo");
  });

  it("trouve l'en-tête même après un bandeau de plus de 15 lignes", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("X");
    sheet.addRow(["Situation du Client X"]);
    for (let i = 0; i < 20; i++) sheet.addRow([]);
    sheet.addRow(["Date", "Nature de la M/se", "Quantité", "facture N°", "Total investi", "Montant payé", "Reste a payer", "Benefice net"]);
    sheet.addRow(["01/01/2026", "CONTENEUR", "1", "F1", "1 000 000", "400 000", "600 000", ""]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const rows = await parseDossierBulkXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].montantInvesti).toBe(1_000_000);
  });

  it("replie sur le nom de la feuille quand aucun titre « Situation du Client » n'est présent", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Mahamadou Drame");
    sheet.addRow(["Date", "Nature de la M/se", "Quantité", "facture N°", "Total investi", "Montant payé", "Reste a payer", "Benefice net"]);
    sheet.addRow(["01/01/2026", "CONTENEUR", "1", "", "1 000 000", "", "", ""]);
    const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const rows = await parseDossierBulkXlsx(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].clientNom).toBe("Mahamadou Drame");
  });
});
