import { describe, expect, it } from "vitest";
import {
  ecritureClasseurReference,
  normalizeClasseurRef,
} from "@/lib/excel/sltt-bridge";

describe("normalizeClasseurRef", () => {
  it("aligne ÉCR et ECR (accents + casse)", () => {
    const id = "abcdef01-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const canon = ecritureClasseurReference(id);
    expect(normalizeClasseurRef(canon)).toBe(normalizeClasseurRef("ECR-ABCDEF01"));
    expect(normalizeClasseurRef("  Écr-AbCdEf01  ")).toBe("ecr-abcdef01");
  });
});
