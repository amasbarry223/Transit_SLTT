import { describe, expect, it, vi } from "vitest";

// Les mappers vivent dans des slices qui importent l'api-client au chargement.
vi.mock("@/lib/api-client", () => ({ api: {} }));

const { mapDossierFromDb } = await import("@/lib/store/dossiers-slice");
const { mapFactureFromDb } = await import("@/lib/store/factures-slice");
const { mapRecuPaiementFromDb } = await import("@/lib/store/recus-paiement-slice");

/**
 * Régression : quand une colonne numérique est absente/null dans la ligne DB,
 * `Number(undefined)` renvoyait NaN et contaminait tous les agrégats
 * (« Créances totales NaN FCFA » sur le tableau de bord). Les mappers doivent
 * retomber sur 0.
 */
describe("mappers — colonnes numériques manquantes → 0 (jamais NaN)", () => {
  it("mapDossierFromDb", () => {
    const d = mapDossierFromDb({
      id: "d1",
      reference: "TR-2026-0001",
      annexe_id: "a1",
      client_id: "c1",
      bl: null,
      camion: null,
      nature: "Divers",
      statut: "En cours",
      date: "2026-01-01",
    } as never);
    for (const v of [d.droitDouane, d.fraisCircuit, d.fraisPrestation, d.montantInvesti, d.montantPaye]) {
      expect(Number.isNaN(v)).toBe(false);
      expect(v).toBe(0);
    }
  });

  it("mapFactureFromDb (entête + lignes)", () => {
    const f = mapFactureFromDb({
      id: "f1",
      numero: "FAC-0001",
      dossier_id: null,
      client_id: "c1",
      annexe_id: "a1",
      date: "2026-01-01",
      date_echeance: null,
      statut: "Brouillon",
      notes: null,
      cree_par: null,
      facture_lignes: [{ id: "l1", description: "x" }],
    } as never);
    for (const v of [f.tauxTVA, f.montantHT, f.montantTVA, f.montantTTC, f.montantPaye]) {
      expect(Number.isNaN(v)).toBe(false);
    }
    for (const v of [f.lignes[0].quantite, f.lignes[0].prixUnitaire, f.lignes[0].montantHT]) {
      expect(Number.isNaN(v)).toBe(false);
    }
  });

  it("mapRecuPaiementFromDb", () => {
    const r = mapRecuPaiementFromDb({
      id: "r1",
      reference: "RECU-0001",
      annexe_id: "a1",
      nom: "Doe",
      prenom: "John",
      motif: "Acompte",
      statut: "Partiel",
      created_at: "2026-01-01",
    } as never);
    for (const v of [r.somme, r.montantPaye, r.reste]) {
      expect(Number.isNaN(v)).toBe(false);
      expect(v).toBe(0);
    }
  });
});
