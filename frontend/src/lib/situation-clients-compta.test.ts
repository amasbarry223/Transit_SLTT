import { describe, expect, it } from "vitest";
import type { Annexe, Client, Dossier, Facture, OperationComptable } from "@/lib/domain-types";
import {
  buildSituationsClients,
  matchesSoldeFilter,
  operationsDuClient,
  TOUTES_ANNEXES,
} from "@/lib/situation-clients-compta";

const annexes = [{ id: "a1", nom: "Mali" }] as Annexe[];
const client = (id: string, nom = id): Client => ({ id, nom, annexeId: "a1" }) as Client;
const dossier = (p: Partial<Dossier>): Dossier =>
  ({ id: "d", annexeId: "a1", clientId: "c1", totalContrat: 0, montantPaye: 0, ...p }) as Dossier;
const facture = (p: Partial<Facture>): Facture =>
  ({ id: "f", clientId: "c1", annexeId: "a1", dossierId: null, statut: "Envoyée", montantTTC: 0, montantPaye: 0, ...p }) as Facture;

function build(over: Partial<Parameters<typeof buildSituationsClients>[0]>) {
  return buildSituationsClients({
    clients: [client("c1")],
    dossiers: [],
    contrats: [],
    factures: [],
    annexes,
    annexeFilter: TOUTES_ANNEXES,
    ...over,
  });
}

describe("buildSituationsClients", () => {
  it("calcule dû / encaissé / reste depuis les paiements du dossier, pas depuis les dépenses", () => {
    const [s] = build({
      dossiers: [
        dossier({
          totalContrat: 1_000_000,
          paiements: [{ date: "2026-01-01", montant: 400_000, mode: "ESPECES" }],
          depenses: [{ date: "2026-01-02", nature: "Douane", categorie: "DOUANE", montant: 700_000 }],
        }),
      ],
    });
    expect(s.totalDu).toBe(1_000_000);
    expect(s.avancesPayees).toBe(400_000);
    expect(s.resteAPayer).toBe(600_000);
    expect(s.totalDepenses).toBe(700_000);
    expect(s.tropPercu).toBe(0);
  });

  it("expose le trop-perçu au lieu de le masquer", () => {
    const [s] = build({ dossiers: [dossier({ totalContrat: 100, montantPaye: 150 })] });
    expect(s.resteAPayer).toBe(0);
    expect(s.tropPercu).toBe(50);
  });

  it("n'ajoute pas une facture liée à un dossier (déjà portée par le dossier), mais compte les factures libres", () => {
    const [s] = build({
      dossiers: [dossier({ id: "d1", totalContrat: 100, montantPaye: 0 })],
      factures: [
        facture({ id: "f1", dossierId: "d1", montantTTC: 100 }),
        facture({ id: "f2", montantTTC: 50, montantPaye: 20 }),
        facture({ id: "f3", statut: "Annulée", montantTTC: 999 }),
        facture({ id: "f4", statut: "Brouillon", montantTTC: 999 }),
      ],
    });
    expect(s.totalDu).toBe(150);
    expect(s.avancesPayees).toBe(20);
    expect(s.nbFacturesLibres).toBe(1);
  });

  it("filtre par annexe et ignore les clients sans activité dans cette annexe", () => {
    const rows = build({
      annexeFilter: "a2",
      dossiers: [dossier({ totalContrat: 100 })],
    });
    expect(rows).toHaveLength(0);
  });
});

describe("matchesSoldeFilter", () => {
  const base = { resteAPayer: 0, tropPercu: 0 } as Parameters<typeof matchesSoldeFilter>[0];
  it("distingue débiteur / soldé / trop-perçu", () => {
    expect(matchesSoldeFilter({ ...base, resteAPayer: 10 }, "debiteur")).toBe(true);
    expect(matchesSoldeFilter(base, "solde")).toBe(true);
    expect(matchesSoldeFilter({ ...base, tropPercu: 5 }, "solde")).toBe(false);
    expect(matchesSoldeFilter({ ...base, tropPercu: 5 }, "crediteur")).toBe(true);
  });
});

describe("operationsDuClient", () => {
  const op = (p: Partial<OperationComptable>): OperationComptable =>
    ({ id: "o", annexeId: "a1", date: "2026-01-01", clientNom: "X", ...p }) as OperationComptable;
  it("rattache par clientId ou dossier, jamais par nom, et respecte l'annexe", () => {
    const ops = [
      op({ id: "1", clientId: "c1" }),
      op({ id: "2", dossierId: "d1" }),
      op({ id: "3", clientNom: "c1" }), // homonyme : ignoré
      op({ id: "4", clientId: "c1", annexeId: "a2" }),
    ];
    const res = operationsDuClient(ops, "c1", new Set(["d1"]), "a1");
    expect(res.map((o) => o.id).sort()).toEqual(["1", "2"]);
  });
});
