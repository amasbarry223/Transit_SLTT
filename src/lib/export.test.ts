import { describe, expect, it } from "vitest";
import { buildCsvBlob, shouldShowTva } from "./export";

interface TransporteurRow {
  nom: string;
  contact: string;
  telephone: string;
  vehicule: string;
  statut: string;
}

const columns = [
  { header: "Société", accessor: (t: TransporteurRow) => t.nom },
  { header: "Contact", accessor: (t: TransporteurRow) => t.contact },
  { header: "Téléphone", accessor: (t: TransporteurRow) => t.telephone },
  { header: "Véhicule", accessor: (t: TransporteurRow) => t.vehicule },
  { header: "Statut", accessor: (t: TransporteurRow) => t.statut },
];

const sampleRows: TransporteurRow[] = [
  {
    nom: "Konaté Transport",
    contact: "Mamadou Konaté",
    telephone: "+223 76 12 34 56",
    vehicule: "Semi-remorque",
    statut: "Actif",
  },
  {
    nom: "Golaine Tech",
    contact: "Ibrahim Diarra",
    telephone: "+223 66 98 77 44",
    vehicule: "Camion",
    statut: "Actif",
  },
];

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

describe("buildCsvBlob", () => {
  it("produit un blob non vide avec BOM UTF-8", async () => {
    const blob = buildCsvBlob(columns, sampleRows);
    expect(blob.size).toBeGreaterThan(0);

    const bytes = await blobToBytes(blob);
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
  });

  it("contient sep=;, les en-têtes et les données", async () => {
    const blob = buildCsvBlob(columns, sampleRows);
    const text = new TextDecoder("utf-8").decode(await blob.arrayBuffer());

    expect(text).toContain("sep=;");
    expect(text).toContain("Société");
    expect(text).toContain("Contact");
    expect(text).toContain("Konaté Transport");
    expect(text).toContain("Golaine Tech");
    expect(text).toContain("Semi-remorque");
  });

  it("retourne uniquement l'en-tête si aucune ligne de données", async () => {
    const blob = buildCsvBlob(columns, []);
    const text = new TextDecoder("utf-8").decode(await blob.arrayBuffer());

    expect(text).toContain("sep=;");
    expect(text).toContain("Société");
    expect(text).not.toContain("Konaté Transport");
  });

  it("neutralise l'injection de formule Excel (=, +, -, @)", async () => {
    const rows: TransporteurRow[] = [
      {
        nom: "=CMD(calc)",
        contact: "+223 00 00 00",
        telephone: "-1+1",
        vehicule: "@SUM(A1)",
        statut: "Actif",
      },
    ];
    const blob = buildCsvBlob(columns, rows);
    const text = new TextDecoder("utf-8").decode(await blob.arrayBuffer());

    expect(text).toContain("'=CMD(calc)");
    expect(text).toContain("'+223 00 00 00");
    expect(text).toContain("'-1+1");
    expect(text).toContain("'@SUM(A1)");
    expect(text).not.toMatch(/;=CMD/);
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
