"use client";

import { htmlEscape } from "../html-escape";

/**
 * Bloc de signatures officielles imprimé en bas des documents SLTT
 * (facture, devis, bon de caisse) : trois colonnes — Directeur Général,
 * Receveur, Visa du PDG — libellé en haut, espace de signature, filet, puis
 * nom du signataire en bas.
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
 * Rendu en <table> à trois colonnes strictement identiques : `border-collapse:
 * separate` + `border-spacing` horizontal donne trois cellules de largeur
 * rigoureusement égale, séparées par une gouttière constante. Chaque colonne
 * porte donc son propre filet de signature (`.sig-line`), de même longueur et
 * à la même hauteur que les deux autres — trois zones bien distinctes et
 * régulièrement réparties, quel que soit le retrait du document conteneur.
 */
export const SIGNATORIES_BLOCK_CSS = `
.signatories {
  width: 100%;
  border-collapse: separate;
  border-spacing: 26px 0;
  table-layout: fixed;
  page-break-inside: avoid;
}
.signatories td {
  width: 33.333%;
  padding: 0;
  vertical-align: top;
  text-align: center;
}
.signatories .sig-role {
  font-size: 10.5px;
  font-weight: 700;
  color: #263041;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.signatories .sig-line {
  margin-top: 58px;
  border-top: 1px solid #9aa4b2;
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

  const col = (role: string, name: string) => `<td>
        <div class="sig-role">${role}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${htmlEscape(name)}</div>
      </td>`;

  return `<table class="signatories">
    <tr>
      ${col("Directeur Général", dg)}
      ${col("Receveur", receveur)}
      ${col("Visa du PDG", pdg)}
    </tr>
  </table>`;
}
