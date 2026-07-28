import { describe, expect, it } from "vitest";
import {
  applyFacturePaiement,
  canDecrementStock,
  simulateSequentialPaiements,
} from "@/lib/paiement-math";

describe("record_facture_paiement invariants", () => {
  it("refuse double encaissement qui dépasse le TTC (verrou séquentiel)", () => {
    const result = simulateSequentialPaiements(
      { statut: "Envoyée", montantTtc: 100_000, montantPaye: 0 },
      [80_000, 80_000],
    );
    expect(result.montantPaye).toBe(80_000);
    expect(result.statut).toBe("Partielle");
    expect(result.rejected).toBe(1);
  });

  it("solde exactement sans dépassement", () => {
    const result = simulateSequentialPaiements(
      { statut: "Envoyée", montantTtc: 50_000, montantPaye: 0 },
      [30_000, 20_000],
    );
    expect(result.montantPaye).toBe(50_000);
    expect(result.statut).toBe("Soldée");
    expect(result.rejected).toBe(0);
  });

  it("refuse paiement sur Soldée", () => {
    const res = applyFacturePaiement({
      statut: "Soldée",
      montantTtc: 10,
      montantPaye: 10,
      paiement: 1,
    });
    expect(res.ok).toBe(false);
  });
});

describe("validate_bon_sortie stock", () => {
  it("refuse stock insuffisant (condition quantite >= sortie)", () => {
    expect(canDecrementStock(5, 6)).toBe(false);
    expect(canDecrementStock(5, 5)).toBe(true);
  });
});
