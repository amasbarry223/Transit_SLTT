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
 * Rendu en <table> : trois colonnes strictement égales (33,33 %), libellés et
 * noms sur des lignes parfaitement alignées quel que soit le moteur de rendu
 * (un <table> s'imprime de façon identique partout, contrairement à un
 * flex/grid qui peut se décaler si un libellé passe à la ligne).
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
  padding: 0 10px 0 0;
  vertical-align: top;
  overflow: hidden;
  text-overflow: ellipsis;
}
.signatories td:last-child { padding-right: 0; }
.signatories .sig-role {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.signatories .sig-gap td { height: 66px; }
.signatories .sig-name {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  border-top: 1px solid #cdd4df;
  padding-top: 6px;
}
@media print { .signatories { page-break-inside: avoid; } }
`;

/** HTML du bloc 3 signatures. */
export function buildSignatoriesBlockHTML(overrides?: SignatoriesOverrides): string {
  const dg = overrides?.dg?.trim() || SIGNATORY_DEFAULTS.dg;
  const receveur = overrides?.receveur?.trim() || SIGNATORY_DEFAULTS.receveur;
  const pdg = overrides?.pdg?.trim() || SIGNATORY_DEFAULTS.pdg;

  return `<table class="signatories">
    <tr>
      <td class="sig-role">Directeur Général</td>
      <td class="sig-role">Receveur</td>
      <td class="sig-role">Visa du PDG</td>
    </tr>
    <tr class="sig-gap"><td></td><td></td><td></td></tr>
    <tr>
      <td class="sig-name">${htmlEscape(dg)}</td>
      <td class="sig-name">${htmlEscape(receveur)}</td>
      <td class="sig-name">${htmlEscape(pdg)}</td>
    </tr>
  </table>`;
}
