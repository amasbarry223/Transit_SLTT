import { describe, expect, it } from "vitest";
import { facturesLibres, syncClientStats, sommeDepensesDossiers, sommeEncaisse } from "./client-stats";
import type { Client, Dossier, Facture, Ecriture } from "@/lib/store";

describe("syncClientStats", () => {
  it("le dossier fait foi : une facture liée n'est pas recomptée, une facture libre l'est", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: "a1" }];
    const dossiers = [{ id: "d1", clientId: "c1", totalContrat: 1000, montantPaye: 400 }] as Dossier[];
    const factures = [
      { clientId: "c1", dossierId: "d1", statut: "Partielle", montantTTC: 1180, montantPaye: 200 }, // liée : ignorée
      { clientId: "c1", dossierId: null, statut: "Partielle", montantTTC: 500, montantPaye: 200 }, // libre
    ] as Facture[];
    const ecritures = [
      { clientId: "c1", dossierId: "d1", montantInvesti: 500, montantPaye: 100 },
      { clientId: "c1", dossierId: null, montantInvesti: 300, montantPaye: 50 },
    ] as Ecriture[];
    const [updated] = syncClientStats(dossiers, factures, ecritures, clients);
    expect(updated.nbDossiers).toBe(1);
    // dossier 400 + facture libre 200 + écriture autonome 50
    expect(updated.totalPaye).toBe(650);
    // reste dossier 600 + reste facture libre 300 + reste écriture autonome 250
    expect(updated.totalDu).toBe(1150);
    expect(updated.totalInvesti).toBe(1000 + 500 + 300);
  });

  it("exclut les factures annulées du total dû", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: "a1" }];
    const factures = [
      { clientId: "c1", statut: "Annulée", montantTTC: 1000, montantPaye: 0 },
    ] as Facture[];
    const [updated] = syncClientStats([], factures, [], clients);
    expect(updated.totalDu).toBe(0);
  });

  it("sommeEncaisse : règlements de tous les dossiers (facturés ou non) + factures libres, filtrables par date", () => {
    const dossiers = [
      { id: "d1", montantPaye: 400, dateSolde: "2026-03-10" },
      { id: "d2", montantPaye: 900, dateSolde: "2026-04-02" }, // hors période
      { id: "d3", montantPaye: 700, dateSolde: "2026-03-20" }, // facturé : compte quand même
      { id: "d4", montantPaye: 0, dateSolde: "2026-03-15" },
    ] as Dossier[];
    const factures = [
      { dossierId: "d3", statut: "Partielle", date: "2026-03-20", montantPaye: 700 }, // liée : ignorée
      { dossierId: null, statut: "Partielle", date: "2026-03-05", montantPaye: 100 }, // libre
      { dossierId: null, statut: "Annulée", date: "2026-03-05", montantPaye: 999 },
    ] as Facture[];
    const enMars = (iso: string) => iso >= "2026-03-01" && iso <= "2026-03-31";
    expect(sommeEncaisse(dossiers, factures, enMars)).toBe(400 + 700 + 100);
    expect(sommeEncaisse(dossiers, factures)).toBe(400 + 900 + 700 + 100);
  });

  it("facturesLibres exclut les factures liées, annulées et en brouillon", () => {
    const factures = [
      { id: "1", dossierId: "d1", statut: "Envoyée" },
      { id: "2", dossierId: null, statut: "Envoyée" },
      { id: "3", dossierId: null, statut: "Annulée" },
      { id: "4", dossierId: null, statut: "Brouillon" },
    ] as Facture[];
    expect(facturesLibres(factures).map((f) => f.id)).toEqual(["2"]);
  });

  it("compte le reste à payer d'une facture impayée même sans dossier associé", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: "a1" }];
    const factures = [
      { clientId: "c1", statut: "Envoyée", montantTTC: 1200, montantPaye: 0 },
    ] as Facture[];
    const [updated] = syncClientStats([], factures, [], clients);
    expect(updated.nbDossiers).toBe(0);
    expect(updated.totalDu).toBe(1200);
  });

  it("un dossier en avance ne compense pas un autre dossier dû (pas de solde net, une somme par enregistrement clampée à 0)", () => {
    // Scénario Phase 5 : dossier d1 en avance (payé 200 de plus que dû),
    // dossier d2 dû de 600 — client-fiche-screen.tsx recalculait auparavant
    // un solde NET (investi - payé sur tout le classeur) qui aurait donné
    // 400 ici (600 - 200), différent de la liste clients/export (600, somme
    // de resteAPayer clampés à 0 par dossier — d1 ne peut pas passer sous 0).
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: "a1" }];
    const dossiers = [
      // Dû client = total contrat (dossier-finances.ts).
      { id: "d1", clientId: "c1", totalContrat: 1000, montantPaye: 1200 }, // avance de 200
      { id: "d2", clientId: "c1", totalContrat: 600, montantPaye: 0 }, // dû de 600
    ] as Dossier[];
    const [updated] = syncClientStats(dossiers, [], [], clients);
    expect(updated.totalDu).toBe(600);
    expect(updated.totalPaye).toBe(1200);
    expect(updated.totalInvesti).toBe(1600);
  });
});

describe("sommeEncaisse — datation par règlement", () => {
  const mois = (m: string) => (iso: string) => iso.startsWith(`2026-${m}`);
  const dossiers = [
    {
      id: "d1",
      totalContrat: 900,
      montantPaye: 900,
      dateSolde: "2026-03-10",
      paiements: [
        { date: "2026-01-05", montant: 300, mode: "ESPECES" },
        { date: "2026-02-05", montant: 300, mode: "ESPECES" },
        { date: "2026-03-10", montant: 300, mode: "ESPECES" },
      ],
    },
  ] as Dossier[];

  it("range chaque versement dans son mois, pas tout le cumul dans le mois du dernier", () => {
    expect(sommeEncaisse(dossiers, [], mois("01"))).toBe(300);
    expect(sommeEncaisse(dossiers, [], mois("02"))).toBe(300);
    expect(sommeEncaisse(dossiers, [], mois("03"))).toBe(300);
    expect(sommeEncaisse(dossiers, [])).toBe(900);
  });
});

describe("sommeDepensesDossiers", () => {
  it("additionne les dépenses de dossier par date, facturés ou non", () => {
    const dossiers = [
      { id: "d1", depenses: [{ date: "2026-01-02", nature: "Douane", categorie: "DOUANE", montant: 100 }, { date: "2026-02-02", nature: "T", categorie: "TRANSPORT", montant: 50 }] },
      { id: "d2" },
    ] as Dossier[];
    expect(sommeDepensesDossiers(dossiers)).toBe(150);
    expect(sommeDepensesDossiers(dossiers, (iso) => iso.startsWith("2026-02"))).toBe(50);
  });
});
