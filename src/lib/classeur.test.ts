import { describe, expect, it } from "vitest";
import {
  buildClasseurJournal,
  computeClasseurTotals,
  filterClasseurJournal,
  hasClasseurPeriodFilter,
} from "./classeur";
import type { Dossier, Ecriture, Facture, Societe } from "@/lib/domain-types";

const SLTT_ID = "22222222-2222-2222-2222-222222222222";

const societes: Societe[] = [
  {
    id: SLTT_ID,
    nom: "SLTT",
    actif: true,
    adresse: "Bamako",
    telephone: "",
    rccm: "",
    nif: "",
    logoUrl: "",
    afficherNomAvecLogo: true,
  },
];

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
        montantInvesti: 1000,
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
        montantInvesti: 500,
        montantPaye: 500,
        statut: "Soldé",
      },
    ] as Dossier[];

    const journal = buildClasseurJournal("c1", dossiers, [], [], societes);
    expect(journal).toHaveLength(2);
    expect(journal[0].reference).toBe("DOS-002");
    expect(journal[0].libelle).toBe("Dossier transit — Export · BL BL-99");
    expect(journal[0].soldeCumule).toBe(0);
    expect(journal[1].soldeCumule).toBe(800);
  });

  it("exclut les écritures liées à un dossier", () => {
    const ecritures = [
      {
        id: "e-linked",
        clientId: "c1",
        dossierId: "d1",
        date: "2026-01-01",
        montantInvesti: 100,
        montantPaye: 0,
      },
      {
        id: "e-free",
        clientId: "c1",
        dossierId: undefined,
        date: "2026-01-02",
        montantInvesti: 300,
        montantPaye: 100,
      },
    ] as Ecriture[];

    const journal = buildClasseurJournal("c1", [], ecritures, [], societes);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("Paiement");
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

    const journal = buildClasseurJournal("c1", [], [], factures, societes);
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
        montantInvesti: 100,
        montantPaye: 0,
        statut: "En cours",
      },
    ] as Dossier[],
    [
      {
        id: "e1",
        clientId: "c1",
        date: "2026-03-15",
        montantInvesti: 200,
        montantPaye: 50,
      },
    ] as Ecriture[],
    [],
    societes,
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
          montantInvesti: 1000,
          montantPaye: 200,
          statut: "En cours",
        },
      ] as Dossier[],
      [
        {
          id: "e1",
          clientId: "c1",
          date: "2026-02-01",
          montantInvesti: 400,
          montantPaye: 100,
        },
      ] as Ecriture[],
      [],
      societes,
    );

    const filtered = filterClasseurJournal(full, { type: "Paiement" });
    const totals = computeClasseurTotals(filtered);

    expect(totals.totalDebit).toBe(400);
    expect(totals.totalCredit).toBe(100);
    expect(totals.soldeNet).toBe(300);
    expect(totals.parSociete).toEqual([{ societeNom: "SLTT", soldeNet: 300 }]);
  });
});

describe("hasClasseurPeriodFilter", () => {
  it("détecte un filtre période actif", () => {
    expect(hasClasseurPeriodFilter({ type: "all" })).toBe(false);
    expect(hasClasseurPeriodFilter({ type: "all", dateFrom: "2026-01-01" })).toBe(true);
  });
});
