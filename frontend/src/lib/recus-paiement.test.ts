import { describe, expect, it } from "vitest";
import {
  computeReste,
  computeStatut,
  filterRecusPaiementByQuery,
  filterRecusPaiementByStatut,
} from "@/lib/recus-paiement";
import type { RecuPaiement } from "@/lib/domain-types";

function recu(partial: Partial<RecuPaiement>): RecuPaiement {
  return {
    id: partial.id ?? "1",
    reference: partial.reference ?? "RECU-1",
    annexeId: partial.annexeId ?? "a-ml",
    nom: partial.nom ?? "Traore",
    prenom: partial.prenom ?? "Ali",
    somme: partial.somme ?? 0,
    motif: partial.motif ?? "Motif",
    montantPaye: partial.montantPaye ?? 0,
    reste: partial.reste ?? 0,
    statut: partial.statut ?? "EN_ATTENTE",
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00Z",
  };
}

describe("computeReste", () => {
  it("calcule somme moins montant payé", () => {
    expect(computeReste(100000, 40000)).toBe(60000);
  });

  it("ne devient jamais négatif en cas de trop-perçu", () => {
    expect(computeReste(50000, 70000)).toBe(0);
  });
});

describe("computeStatut", () => {
  it("EN_ATTENTE si rien n'a été payé", () => {
    expect(computeStatut(100000, 0)).toBe("EN_ATTENTE");
  });

  it("PARTIEL si payé partiellement", () => {
    expect(computeStatut(100000, 40000)).toBe("PARTIEL");
  });

  it("SOLDE si le montant payé couvre la somme", () => {
    expect(computeStatut(100000, 100000)).toBe("SOLDE");
  });
});

describe("filterRecusPaiementByQuery", () => {
  it("filtre par nom, prénom, référence ou motif", () => {
    const recus = [
      recu({ id: "1", nom: "Traore", prenom: "Ali", reference: "RECU-1", motif: "Avance" }),
      recu({ id: "2", nom: "Diallo", prenom: "Fatou", reference: "RECU-2", motif: "Remboursement" }),
    ];
    expect(filterRecusPaiementByQuery(recus, "diallo").map((r) => r.id)).toEqual(["2"]);
    expect(filterRecusPaiementByQuery(recus, "avance").map((r) => r.id)).toEqual(["1"]);
    expect(filterRecusPaiementByQuery(recus, "").map((r) => r.id)).toEqual(["1", "2"]);
  });
});

describe("filterRecusPaiementByStatut", () => {
  it("filtre par statut, 'all' ne filtre rien", () => {
    const recus = [
      recu({ id: "1", statut: "EN_ATTENTE" }),
      recu({ id: "2", statut: "SOLDE" }),
    ];
    expect(filterRecusPaiementByStatut(recus, "SOLDE").map((r) => r.id)).toEqual(["2"]);
    expect(filterRecusPaiementByStatut(recus, "all")).toHaveLength(2);
  });
});
