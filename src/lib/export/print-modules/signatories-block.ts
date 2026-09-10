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

export const SIGNATORIES_BLOCK_CSS = `
.signatories {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 34px;
  page-break-inside: avoid;
}
.signatory { min-width: 0; }
.signatory-role {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.01em;
}
.signatory-gap { height: 78px; }
.signatory-name {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
  border-top: 1px solid #cdd4df;
  padding-top: 6px;
  display: inline-block;
  min-width: 130px;
}
@media print { .signatories { break-inside: avoid; } }
`;

/** HTML du bloc 3 signatures. */
export function buildSignatoriesBlockHTML(overrides?: SignatoriesOverrides): string {
  const dg = overrides?.dg?.trim() || SIGNATORY_DEFAULTS.dg;
  const receveur = overrides?.receveur?.trim() || SIGNATORY_DEFAULTS.receveur;
  const pdg = overrides?.pdg?.trim() || SIGNATORY_DEFAULTS.pdg;

  const col = (role: string, name: string) => `
    <div class="signatory">
      <div class="signatory-role">${htmlEscape(role)}</div>
      <div class="signatory-gap"></div>
      <div class="signatory-name">${htmlEscape(name)}</div>
    </div>`;

  return `<div class="signatories">
    ${col("Directeur Général", dg)}
    ${col("Receveur", receveur)}
    ${col("Visa du PDG", pdg)}
  </div>`;
}
