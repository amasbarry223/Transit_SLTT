import { describe, expect, it } from "vitest";
import {
  mapClotureCaisseFromDb,
  mapOperationComptableFromDb,
} from "@/lib/store/comptabilite-generale-slice";
import type { ClotureCaisseRow, OperationComptableRow } from "@/lib/db-rows";

describe("mapOperationComptableFromDb", () => {
  it("mappe une opération d'annexe (Mali)", () => {
    const row: OperationComptableRow = {
      id: "o1",
      reference: "OPC-1",
      entite_type: "annexe",
      annexe_id: "a1",
      annexes: { nom: "Mali" },
      societe_id: null,
      societes: null,
      date: "2026-01-12",
      client_id: null,
      clients: null,
      client_nom: "DOUNIYA INFORM ELECTRO",
      nature: "ACHAT DE MATERIEL INFORMATIQUE",
      type: "Sortie",
      montant: "555000",
      quantite: null,
      prix_unitaire: null,
      source: "saisie",
      import_ref: null,
      cree_par: "Admin",
    };
    const mapped = mapOperationComptableFromDb(row);
    expect(mapped.entiteType).toBe("annexe");
    expect(mapped.annexeId).toBe("a1");
    expect(mapped.societeId).toBeUndefined();
    expect(mapped.montant).toBe(555000);
    expect(mapped.quantite).toBeUndefined();
  });

  it("mappe une opération Top Doumani avec quantité × prix unitaire", () => {
    const row: OperationComptableRow = {
      id: "o2",
      reference: "OPC-2",
      entite_type: "societe",
      annexe_id: null,
      annexes: null,
      societe_id: "s1",
      societes: { nom: "Top Doumani" },
      date: "2026-02-01",
      client_id: null,
      clients: null,
      client_nom: "Client X",
      nature: "Vente ciment",
      type: "Sortie",
      montant: "250000",
      quantite: "50",
      prix_unitaire: "5000",
      source: "saisie",
      import_ref: null,
      cree_par: null,
    };
    const mapped = mapOperationComptableFromDb(row);
    expect(mapped.entiteType).toBe("societe");
    expect(mapped.societeId).toBe("s1");
    expect(mapped.quantite).toBe(50);
    expect(mapped.prixUnitaire).toBe(5000);
    expect(mapped.montant).toBe(250000);
  });
});

describe("mapClotureCaisseFromDb", () => {
  it("mappe une clôture et calcule l'écart déjà fourni par la colonne générée", () => {
    const row: ClotureCaisseRow = {
      id: "c1",
      entite_type: "annexe",
      annexe_id: "a1",
      societe_id: null,
      periode_debut: "2026-03-01",
      periode_fin: "2026-03-31",
      solde_theorique: "170090500",
      solde_constate: "203995506",
      ecart: "-33905006",
      note: null,
      cloture_par: "Admin",
      cloture_le: "2026-04-01T10:00:00Z",
    };
    const mapped = mapClotureCaisseFromDb(row);
    expect(mapped.soldeTheorique).toBe(170090500);
    expect(mapped.soldeConstate).toBe(203995506);
    expect(mapped.ecart).toBe(-33905006);
  });
});
