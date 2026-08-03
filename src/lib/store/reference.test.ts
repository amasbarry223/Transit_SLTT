import { describe, expect, it } from "vitest";
import { nextYearlyReference, padSeq } from "@/lib/store/reference";

describe("padSeq", () => {
  it("pad à 4 chiffres par défaut", () => {
    expect(padSeq(1)).toBe("0001");
    expect(padSeq(42)).toBe("0042");
  });

  it("respecte une longueur custom", () => {
    expect(padSeq(7, 3)).toBe("007");
  });
});

describe("nextYearlyReference", () => {
  it("construit PREFIX-year-seq", () => {
    expect(nextYearlyReference("FACT", 3, 4, 2026)).toBe("FACT-2026-0003");
    expect(nextYearlyReference("DEVIS", 12, 4, 2026)).toBe("DEVIS-2026-0012");
    expect(nextYearlyReference("BS", 1, 4, 2026)).toBe("BS-2026-0001");
    expect(nextYearlyReference("CTR", 99, 4, 2026)).toBe("CTR-2026-0099");
  });
});
