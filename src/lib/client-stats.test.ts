import { describe, expect, it } from "vitest";
import { syncClientStats } from "./client-stats";
import type { Client, Dossier, Facture, Ecriture } from "@/lib/store";

describe("syncClientStats", () => {
  it("additionne dossiers, factures actives et écritures sans double-compter les écritures liées", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "" }];
    const dossiers = [{ clientId: "c1", montantInvesti: 1000, montantPaye: 400 }] as Dossier[];
    const factures = [
      { clientId: "c1", statut: "Partielle", montantTTC: 500, montantPaye: 200 },
    ] as Facture[];
    const ecritures = [
      { clientId: "c1", dossierId: "d1", montantInvesti: 500, montantPaye: 100 },
      { clientId: "c1", dossierId: null, montantInvesti: 300, montantPaye: 50 },
    ] as Ecriture[];
    const [updated] = syncClientStats(dossiers, factures, ecritures, clients);
    expect(updated.nbDossiers).toBe(1);
    expect(updated.totalPaye).toBe(650);
    // dossier restant (600) + écriture autonome restante (250) + facture restante (300)
    expect(updated.totalDu).toBe(1150);
  });

  it("exclut les factures annulées du total dû", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "" }];
    const factures = [
      { clientId: "c1", statut: "Annulée", montantTTC: 1000, montantPaye: 0 },
    ] as Facture[];
    const [updated] = syncClientStats([], factures, [], clients);
    expect(updated.totalDu).toBe(0);
  });

  it("compte le reste à payer d'une facture impayée même sans dossier associé", () => {
    const clients: Client[] = [{ id: "c1", nbDossiers: 0, totalDu: 0, totalPaye: 0, nom: "ACME", type: "Entreprise", telephone: "", email: "", adresse: "" }];
    const factures = [
      { clientId: "c1", statut: "Envoyée", montantTTC: 1200, montantPaye: 0 },
    ] as Facture[];
    const [updated] = syncClientStats([], factures, [], clients);
    expect(updated.nbDossiers).toBe(0);
    expect(updated.totalDu).toBe(1200);
  });
});
