import { describe, expect, it } from "vitest";
import { computeIncrementalPaye, validatePaymentAmount } from "./payments";

describe("payments", () => {
  it("valide et plafonne le montant au reste dû", () => {
    expect(validatePaymentAmount(500, 1000)).toBe(500);
    expect(() => validatePaymentAmount(1500, 1000)).toThrow();
    expect(() => validatePaymentAmount(0, 1000)).toThrow();
  });

  it("calcule le nouveau montant payé sans dépasser le plafond", () => {
    expect(computeIncrementalPaye(200, 1000, 300)).toBe(500);
    expect(computeIncrementalPaye(900, 1000, 500)).toBe(1000);
  });
});
