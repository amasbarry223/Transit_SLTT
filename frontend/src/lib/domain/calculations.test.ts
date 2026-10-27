import { describe, expect, it } from "vitest";
import { beneficeNet, resteAPayer } from "@/lib/domain/calculations";
import {
  FETCH_ENTITY_SOFT_CAPS,
  getRecoveryRateColor,
  RECOVERY_RATE_THRESHOLDS,
} from "@/lib/constants/business";

describe("domain calculations", () => {
  it("beneficeNet = total contrat − Σ dépenses", () => {
    expect(
      beneficeNet({ totalContrat: 200, montantPaye: 0, depenses: [{ montant: 100 }, { montant: 50 }] }),
    ).toBe(50);
  });

  it("resteAPayer never returns negative values", () => {
    expect(resteAPayer({ montantInvesti: 1000, montantPaye: 1200 })).toBe(0);
    expect(resteAPayer({ montantInvesti: 1000, montantPaye: 400 })).toBe(600);
  });
});

describe("business constants", () => {
  it("exposes fetch soft caps", () => {
    expect(FETCH_ENTITY_SOFT_CAPS.default).toBe(2000);
  });

  it("maps recovery rate to color tokens", () => {
    expect(getRecoveryRateColor(RECOVERY_RATE_THRESHOLDS.good)).toBe("emerald");
    expect(getRecoveryRateColor(RECOVERY_RATE_THRESHOLDS.medium)).toBe("amber");
    expect(getRecoveryRateColor(10)).toBe("red");
  });
});
