import { describe, expect, it } from "vitest";
import { formatPhoneNumber, buildContratPrintHTML, type ContratPrintData } from "./contrat-print";

describe("contrat-print", () => {
  describe("formatPhoneNumber", () => {
    it("formate un numéro malien standard (+223)", () => {
      expect(formatPhoneNumber("+22377778546")).toBe("+223 77 77 85 46");
    });

    it("préserve un numéro déjà espacé", () => {
      expect(formatPhoneNumber("+223 77 77 85 46")).toBe("+223 77 77 85 46");
    });

    it("formate des numéros multiples séparés par /", () => {
      expect(formatPhoneNumber("+22377778546 / +2250102030405")).toBe("+223 77 77 85 46 / +225 01 02 03 04 05");
    });

    it("formate un numéro ivoirien à 10 chiffres (+225)", () => {
      expect(formatPhoneNumber("+2250700000000")).toBe("+225 07 00 00 00 00");
    });

    it("formate un numéro local 8 chiffres", () => {
      expect(formatPhoneNumber("77778546")).toBe("77 77 85 46");
    });

    it("gère une chaîne vide ou undefined", () => {
      expect(formatPhoneNumber("")).toBe("");
      expect(formatPhoneNumber(undefined)).toBe("");
      expect(formatPhoneNumber("   ")).toBe("");
    });
  });

  describe("buildContratPrintHTML", () => {
    const mockData: ContratPrintData = {
      reference: "CTR-2026-0001",
      clientNom: "Mohamed Traore",
      clientAdresse: "Aci 2000",
      clientTelephone: "+22377778546",
      clientEmail: "mohamedtraore@gmail.com",
      objet: "Entreposage marchandises",
      dateDebut: "2026-09-17",
      dateFin: "2026-10-10",
      montant: 350000,
      statut: "Actif",
      prestations: [],
      depenses: [],
      totalDepenses: 0,
    };

    it("génère les cartes structurées pour le Client et le Prestataire", () => {
      const html = buildContratPrintHTML(mockData);

      // Présence des deux blocs contractants
      expect(html).toContain("party-card--prestataire");
      expect(html).toContain("party-card--client");
      expect(html).toContain("Prestataire de services");
      expect(html).toContain("Client contractant");

      // Nom du client et coordonnées avec numéro formaté
      expect(html).toContain("Mohamed Traore");
      expect(html).toContain("Aci 2000");
      expect(html).toContain("+223 77 77 85 46");
      expect(html).toContain("mohamedtraore@gmail.com");

      // Icônes SVG intégrées
      expect(html).toContain('title="Adresse"');
      expect(html).toContain('title="Téléphone"');
      expect(html).toContain('title="Email"');
    });

    it("gère l'absence d'adresse, téléphone ou email sans planter", () => {
      const html = buildContratPrintHTML({
        ...mockData,
        clientAdresse: undefined,
        clientTelephone: undefined,
        clientEmail: undefined,
      });

      expect(html).toContain("Mohamed Traore");
      expect(html).not.toContain("mohamedtraore@gmail.com");
      expect(html).not.toContain("+223 77 77 85 46");
    });

    it("échappe correctement les données contre les injections XSS", () => {
      const html = buildContratPrintHTML({
        ...mockData,
        clientNom: "Jean <script>alert(1)</script>",
        clientAdresse: "Rue & cie <test>",
      });

      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(html).toContain("Rue &amp; cie &lt;test&gt;");
    });
  });
});
