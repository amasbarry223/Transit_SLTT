import { describe, expect, it } from "vitest";
import { mapOperationComptableFieldsFromText } from "@/lib/documents/ocr/mappers/operation-comptable-mapper";

describe("mapOperationComptableFieldsFromText", () => {
  it("extrait date, tiers, nature et montant d'un bon de sortie", () => {
    const fields = mapOperationComptableFieldsFromText(
      "Date: 12/01/2026\nBénéficiaire: Ali Badra Traore\nMotif: Frais de circuit\nMontant: 555 000 FCFA",
    );
    expect(fields.find((f) => f.fieldKey === "date")?.fieldValue).toBe("2026-01-12");
    expect(fields.find((f) => f.fieldKey === "client_nom")?.fieldValue).toContain("Ali Badra Traore");
    expect(fields.find((f) => f.fieldKey === "nature")?.fieldValue).toContain("Frais de circuit");
    expect(fields.find((f) => f.fieldKey === "montant")?.fieldValue).toBe("555000");
  });

  it("détecte le type Sortie via les mots-clés de décaissement", () => {
    const fields = mapOperationComptableFieldsFromText("Décaissement — Montant: 100000\nMotif: Loyer");
    expect(fields.find((f) => f.fieldKey === "type")?.fieldValue).toBe("Sortie");
  });

  it("détecte le type Entrée via les mots-clés d'encaissement", () => {
    const fields = mapOperationComptableFieldsFromText("Reçu de Kalilou Coulibaly — Encaissement 2 000 000");
    expect(fields.find((f) => f.fieldKey === "type")?.fieldValue).toBe("Entrée");
  });

  it("n'émet aucun champ type si les deux sens sont présents (ambigu)", () => {
    const fields = mapOperationComptableFieldsFromText("Entrée et sortie mélangées dans le même texte");
    expect(fields.find((f) => f.fieldKey === "type")).toBeUndefined();
  });

  it("ignore un montant invalide plutôt que de préremplir 0", () => {
    const fields = mapOperationComptableFieldsFromText("Montant: abc\nMotif: Test");
    expect(fields.find((f) => f.fieldKey === "montant")).toBeUndefined();
  });
});
