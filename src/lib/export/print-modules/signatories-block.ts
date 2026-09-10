"use client";

import { htmlEscape } from "../html-escape";

/**
 * Bloc de signatures officielles imprimé en bas des documents SLTT
 * (facture, devis, bon de caisse) : trois colonnes — Directeur Général,
 * Receveur, Visa du PDG — libellé en haut, espace de signature, nom en bas.
 *
 * Les noms par défaut sont ceux des dirigeants ; le bon de caisse peut les
 * surcharger avec les valeurs saisies dans Paramètres > Société.
 */
export const SIGNATORY_DEFAULTS = {
  dg: "Ali Badra TRAORE",
  receveur: "OM",
  pdg: "Abdoul TRAORÉ",
} as const;

export interface SignatoriesOverrides {
  dg?: string | null;
  receveur?: string | null;
  pdg?: string | null;
}

/**
 * Rendu en <table> à trois colonnes strictement égales (33,33 %) : un <table>
 * s'imprime de façon identique sur tous les moteurs, contrairement à un
 * flex/grid qui peut se décaler. Chaque colonne porte sa propre ligne de
 * signature (`.sig-line`) séparée des voisines par une gouttière de 36 px,
 * de sorte que les trois zones restent distinctes et régulièrement réparties
 * quelle que soit la marge du document conteneur.
 */
export const SIGNATORIES_BLOCK_CSS = `
.signatories {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  page-break-inside: avoid;
}
.signatories td {
  width: 33.333%;
  padding: 0;
  vertical-align: top;
}
.signatories .sig-col {
  padding: 0 18px;
}
.signatories tr td:first-child .sig-col { padding-left: 0; }
.signatories tr td:last-child .sig-col { padding-right: 0; }
.signatories .sig-role {
  font-size: 10.5px;
  font-weight: 700;
  color: #263041;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.signatories .sig-line {
  margin-top: 60px;
  border-top: 1px solid #b9c1cf;
}
.signatories .sig-name {
  margin-top: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: #263041;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media print { .signatories { page-break-inside: avoid; } }
`;

/** HTML du bloc 3 signatures. */
export function buildSignatoriesBlockHTML(overrides?: SignatoriesOverrides): string {
  const dg = overrides?.dg?.trim() || SIGNATORY_DEFAULTS.dg;
  const receveur = overrides?.receveur?.trim() || SIGNATORY_DEFAULTS.receveur;
  const pdg = overrides?.pdg?.trim() || SIGNATORY_DEFAULTS.pdg;

  const col = (role: string, name: string) => `<td><div class="sig-col">
        <div class="sig-role">${role}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${htmlEscape(name)}</div>
      </div></td>`;

  return `<table class="signatories">
    <tr>
      ${col("Directeur Général", dg)}
      ${col("Receveur", receveur)}
      ${col("Visa du PDG", pdg)}
    </tr>
  </table>`;
}
