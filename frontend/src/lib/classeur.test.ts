import { describe, expect, it } from "vitest";
import {
  buildClasseurJournal,
  computeClasseurTotals,
  filterClasseurJournal,
  hasClasseurPeriodFilter,
} from "./classeur";
import type { Dossier, Facture } from "@/lib/domain-types";

describe("buildClasseurJournal", () => {
  it("trie chronologiquement et calcule le solde cumulé", () => {
    const dossiers = [
      {
        id: "d1",
        clientId: "c1",
        reference: "DOS-001",
        date: "2026-01-10",
        nature: "Import",
        bl: "",
        totalContrat: 1000,
        montantPaye: 200,
        statut: "En cours",
      },
      {
        id: "d2",
        clientId: "c1",
        reference: "DOS-002",
        date: "2026-01-05",
        nature: "Export",
        bl: "BL-99",
        totalContrat: 500,
        montantPaye: 500,
        statut: "Soldé",
      },
    ] as Dossier[];

    const journal = buildClasseurJournal("c1", dossiers, []);
    expect(journal).toHaveLength(2);
    expect(journal[0].reference).toBe("DOS-002");
    expect(journal[0].libelle).toBe("Dossier transit — Export · BL BL-99");
    expect(journal[0].soldeCumule).toBe(0);
    expect(journal[1].soldeCumule).toBe(800);
  });

  it("détaille chaque règlement du dossier en ligne « Paiement » à sa date", () => {
    const dossiers = [
      {
        id: "d1",
        clientId: "c1",
        reference: "DOS-1",
        date: "2026-01-01",
        nature: "Import",
        bl: "",
        totalContrat: 1000,
        montantPaye: 700,
        statut: "En cours",
        paiements: [
          { id: "p1", date: "2026-01-10", montant: 300, mode: "ESPECES" },
          { id: "p2", date: "2026-02-10", montant: 400, mode: "CHEQUE", reference: "CHQ-9" },
        ],
      },
    ] as Dossier[];

    const journal = buildClasseurJournal("c1", dossiers, []);
    expect(journal.map((e) => [e.type, e.debit, e.credit, e.soldeCumule])).toEqual([
      ["Dossier", 1000, 0, 1000],
      ["Paiement", 0, 300, 700],
      ["Paiement", 0, 400, 300],
    ]);
    expect(journal[2].reference).toBe("CHQ-9");
  });

  it("le dossier fait foi : sa facture liée apparaît pour mémoire, sans débit ni crédit (pas de doublon)", () => {
    const dossiers = [
      {
        id: "d1",
        clientId: "c1",
        reference: "DOS-001",
        date: "2026-01-10",
        nature: "Import",
        bl: "",
        totalContrat: 1000,
        montantPaye: 400,
        statut: "En cours",
      },
    ] as Dossier[];
    const factures = [
      {
        id: "f1",
        clientId: "c1",
        dossierId: "d1",
        numero: "FAC-001",
        date: "2026-01-15",
        statut: "Partielle",
        montantTTC: 1180, // dossier + 18% TVA
        montantPaye: 200,
        lignes: [{ description: "Prestation" }],
      },
    ] as Facture[];

    const journal = buildClasseurJournal("c1", dossiers, factures);
    // Le dossier porte le dû (total contrat) et ses règlements ; la facture
    // liée est listée pour mémoire, à 0/0, et le solde reste celui du dossier.
    expect(journal).toHaveLength(2);
    const [dossier, facture] = journal;
    expect(dossier).toMatchObject({ type: "Dossier", debit: 1000, credit: 400 });
    expect(facture).toMatchObject({ type: "Facture", debit: 0, credit: 0 });
    expect(facture.libelle).toContain("comptée sur son dossier");
    expect(journal[journal.length - 1].soldeCumule).toBe(600);
  });

  it("met à zéro débit/crédit pour une facture annulée", () => {
    const factures = [
      {
        id: "f1",
        clientId: "c1",
        numero: "FAC-001",
        date: "2026-02-01",
        statut: "Annulée",
        montantTTC: 900,
        montantPaye: 0,
        lignes: [{ description: "Prestation" }],
      },
    ] as Facture[];

    const journal = buildClasseurJournal("c1", [], factures);
    expect(journal[0].debit).toBe(0);
    expect(journal[0].credit).toBe(0);
  });
});

describe("filterClasseurJournal", () => {
  const entries = buildClasseurJournal(
    "c1",
    [
      {
        id: "d1",
        clientId: "c1",
        reference: "DOS-001",
        date: "2026-03-01",
        nature: "Transit",
        bl: "",
        totalContrat: 100,
        montantPaye: 50,
        statut: "En cours",
        paiements: [{ id: "p1", date: "2026-03-15", montant: 50, mode: "ESPECES" }],
      },
    ] as Dossier[],
    [],
  );

  it("filtre par type et période", () => {
    const byType = filterClasseurJournal(entries, { type: "Dossier" });
    expect(byType).toHaveLength(1);
    expect(byType[0].type).toBe("Dossier");

    const byPeriod = filterClasseurJournal(entries, {
      type: "all",
      dateFrom: "2026-03-10",
      dateTo: "2026-03-20",
    });
    expect(byPeriod).toHaveLength(1);
    expect(byPeriod[0].type).toBe("Paiement");
  });
});

describe("computeClasseurTotals", () => {
  it("agrège les totaux sur la sélection filtrée", () => {
    const full = buildClasseurJournal(
      "c1",
      [
        {
          id: "d1",
          clientId: "c1",
          reference: "DOS-001",
          date: "2026-01-01",
          nature: "Transit",
          bl: "",
          totalContrat: 1000,
          montantPaye: 300,
          statut: "En cours",
          paiements: [
            { id: "p1", date: "2026-02-01", montant: 100, mode: "ESPECES" },
            { id: "p2", date: "2026-03-01", montant: 200, mode: "VIREMENT" },
          ],
        },
      ] as Dossier[],
      [],
    );

    const filtered = filterClasseurJournal(full, { type: "Paiement" });
    const totals = computeClasseurTotals(filtered);

    expect(totals.totalDebit).toBe(0);
    expect(totals.totalCredit).toBe(300);
    expect(totals.soldeNet).toBe(-300);
  });
});

describe("hasClasseurPeriodFilter", () => {
  it("détecte un filtre période actif", () => {
    expect(hasClasseurPeriodFilter({ type: "all" })).toBe(false);
    expect(hasClasseurPeriodFilter({ type: "all", dateFrom: "2026-01-01" })).toBe(true);
  });
});
