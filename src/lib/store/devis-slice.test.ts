import { describe, expect, it } from "vitest";
import { mapDevisFromDb } from "@/lib/store/devis-slice";
import type { DevisRow } from "@/lib/db-rows";

describe("mapDevisFromDb", () => {
  it("mappe client et annexe", () => {
    const row: DevisRow = {
      id: "d1",
      reference: "DEVIS-2026-0001",
      client_id: "c1",
      clients: { nom: "ACME" },
      annexe_id: "a1",
      nature: "Ciment",
      droit_douane: 100,
      frais_circuit: 50,
      frais_prestation: 25,
      total: 175,
      statut: "Brouillon",
      date_creation: "2026-01-01",
      date_validite: "2026-02-01",
      notes: null,
    };
    const mapped = mapDevisFromDb(row);
    expect(mapped.clientNom).toBe("ACME");
    expect(mapped.annexeId).toBe("a1");
  });
});
