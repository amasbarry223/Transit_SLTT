import { describe, expect, it } from "vitest";
import {
  computeAnnexeScopedReference,
  computeDossierReference,
  nextYearlyReference,
  padSeq,
} from "@/lib/store/reference";

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

describe("computeAnnexeScopedReference", () => {
  it("construit CODE-PREFIX-YYYY-NNNN pour une société transit avec annexe", () => {
    const result = computeAnnexeScopedReference(
      { isTransit: true },
      { code: "ML" },
      "BS",
      ["ML-BS-2026-0003"],
      1,
      2026,
    );
    expect(result.reference).toBe("ML-BS-2026-0004");
    expect(result.useAnnexeNumbering).toBe(true);
  });

  it("construit PREFIX-YYYY-NNNN via le compteur global sinon", () => {
    const result = computeAnnexeScopedReference(
      { isTransit: false },
      { code: "ML" },
      "FACT",
      ["ML-BS-2026-0099"],
      5,
      2026,
    );
    expect(result.reference).toBe("FACT-2026-0005");
    expect(result.useAnnexeNumbering).toBe(false);
  });

  it("aperçu (bon de sortie) et génération réelle produisent la même référence", () => {
    // Reproduit le bug corrigé dans BonFormDialog : l'aperçu utilisait un
    // compteur global générique au lieu de la numérotation par annexe.
    const societe = { isTransit: true };
    const annexe = { code: "CI" };
    const existingRefs = ["SLTT-CI-TR-2026-0001", "CI-BS-2026-0007"];
    const preview = computeAnnexeScopedReference(societe, annexe, "BS", existingRefs, 12, 2026);
    const saved = computeAnnexeScopedReference(societe, annexe, "BS", existingRefs, 12, 2026);
    expect(preview.reference).toBe(saved.reference);
    expect(preview.reference).toBe("CI-BS-2026-0008");
  });
});

describe("computeDossierReference", () => {
  it("insère le code annexe et scope la séquence pour une société transit", () => {
    const result = computeDossierReference(
      { isTransit: true },
      { code: "CI" },
      "SLTT",
      ["SLTT-CI-TR-2026-0005", "SLTT-ML-TR-2026-0099"],
      1,
      2026,
    );
    expect(result.reference).toBe("SLTT-CI-TR-2026-0006");
    expect(result.useAnnexeNumbering).toBe(true);
  });

  it("retombe sur la séquence globale sans code annexe ou hors transit", () => {
    const result = computeDossierReference(
      { isTransit: false },
      { code: "CI" },
      "Top Doumani",
      ["SLTT-CI-TR-2026-0099"],
      7,
      2026,
    );
    expect(result.reference).toBe("Top Doumani-TR-2026-0007");
    expect(result.useAnnexeNumbering).toBe(false);
  });

  it("l'aperçu formulaire et la génération réelle produisent la même référence", () => {
    // Reproduit le bug corrigé : avant, l'aperçu du formulaire de création
    // ignorait la numérotation par annexe et affichait un numéro différent
    // de celui réellement attribué à l'enregistrement.
    const societe = { isTransit: true };
    const annexe = { code: "ML" };
    const existingRefs = ["SLTT-ML-TR-2026-0012"];
    const preview = computeDossierReference(societe, annexe, "SLTT", existingRefs, 42, 2026);
    const saved = computeDossierReference(societe, annexe, "SLTT", existingRefs, 42, 2026);
    expect(preview.reference).toBe(saved.reference);
    expect(preview.reference).toBe("SLTT-ML-TR-2026-0013");
  });
});
