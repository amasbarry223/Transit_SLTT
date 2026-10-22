import { describe, expect, it } from "vitest";
import { buildTicketHTML } from "./recu-ticket";

const brand = {
  nom: "Transit SLTT",
  legal: { adresse: "ACI 2000, Bamako", telephone: "+223 20 00 00 00", rccm: "MA.BKO.2025.B.5897" },
};

describe("buildTicketHTML (ticket 80 mm)", () => {
  it("contient numéro, client, montants, montant en lettres, statut et encaisseur", () => {
    const html = buildTicketHTML(
      {
        reference: "RECU-0042",
        date: "2026-10-22T10:00:00.000Z",
        nom: "Diarra",
        prenom: "Awa",
        motif: "Frais de prestation de transit",
        somme: 50000,
        montantPaye: 20000,
        reste: 30000,
        statut: "PARTIEL",
        encaissePar: "Ibrahim Keita",
      },
      brand,
    );

    expect(html).toContain("width: 80mm");
    expect(html).toContain("N° RECU-0042");
    expect(html).toContain("Awa Diarra");
    expect(html).toContain("Frais de prestation de transit");
    expect(html).toMatch(/50\s000 FCFA/);
    expect(html).toMatch(/20\s000 FCFA/);
    expect(html).toMatch(/30\s000 FCFA/);
    expect(html).toContain("Vingt mille francs CFA");
    expect(html).toContain("PAIEMENT PARTIEL");
    expect(html).toContain("Ibrahim Keita");
    expect(html).toContain("RCCM MA.BKO.2025.B.5897");
  });

  it("échappe le HTML saisi (nom, motif)", () => {
    const html = buildTicketHTML(
      { reference: "RECU-1", nom: "<script>x</script>", montantPaye: 1000, somme: 1000 },
      brand,
    );
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
