import { describe, expect, it } from "vitest";
import { syncClientStats, sommeDossiersEncaisses } from "./client-stats";
import type { Client, Dossier, Facture, Ecriture } from "@/lib/store";

describe("syncClientStats", () => {
  it("additionne dossiers, factures autonomes et écritures sans double-compter les écritures liées", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: "a1" }];
    const dossiers = [{ id: "d1", clientId: "c1", montantInvesti: 1000, montantPaye: 400 }] as Dossier[];
    const factures = [
      { clientId: "c1", dossierId: "d1", statut: "Partielle", montantTTC: 500, montantPaye: 200 },
      { clientId: "c1", dossierId: null, statut: "Partielle", montantTTC: 500, montantPaye: 200 },
    ] as Facture[];
    const ecritures = [
      { clientId: "c1", dossierId: "d1", montantInvesti: 500, montantPaye: 100 },
      { clientId: "c1", dossierId: null, montantInvesti: 300, montantPaye: 50 },
    ] as Ecriture[];
    const [updated] = syncClientStats(dossiers, factures, ecritures, clients);
    expect(updated.nbDossiers).toBe(1);
    // dossier payé 400 + facture autonome 200 + écriture autonome 50 (facture liée au dossier exclue)
    expect(updated.totalPaye).toBe(650);
    // dossier restant (600) + écriture autonome restante (250) + facture autonome restante (300)
    expect(updated.totalDu).toBe(1150);
  });

  it("exclut les factures rattachées à un dossier du client (anti double comptage)", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: "a1" }];
    const dossiers = [{ id: "d1", clientId: "c1", montantInvesti: 1000, montantPaye: 0 }] as Dossier[];
    const factures = [
      { clientId: "c1", dossierId: "d1", statut: "Envoyée", montantTTC: 1000, montantPaye: 0 },
    ] as Facture[];
    const [updated] = syncClientStats(dossiers, factures, [], clients);
    expect(updated.totalDu).toBe(1000);
    expect(updated.totalPaye).toBe(0);
  });

  it("exclut les factures annulées du total dû", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "", annexeId: "a1" }];
    const factures = [
      { clientId: "c1", statut: "Annulée", montantTTC: 1000, montantPaye: 0 },
    ] as Facture[];
    const [updated] = syncClientStats([], factures, [], clients);
    expect(updated.totalDu).toBe(0);
  });

  it("sommeDossiersEncaisses : dossiers réglés sans facture, filtrés par dateSolde", () => {
    const dossiers = [
      { id: "d1", montantPaye: 400, dateSolde: "2026-03-10" },
      { id: "d2", montantPaye: 900, dateSolde: "2026-04-02" }, // hors période
      { id: "d3", montantPaye: 700, dateSolde: "2026-03-20" }, // mais facturé -> exclu
      { id: "d4", montantPaye: 0, dateSolde: "2026-03-15" }, // rien payé
    ] as Dossier[];
    const factures = [{ dossierId: "d3" }] as Facture[];
    const enMars = (iso: string) => iso >= "2026-03-01" && iso <= "2026-03-31";
    expect(sommeDossiersEncaisses(dossiers, factures, enMars)).toBe(400);
    // sans filtre période : d1 + d2 (d3 facturé exclu, d4 = 0)
    expect(sommeDossiersEncaisses(dossiers, factures)).toBe(1300);
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
});
