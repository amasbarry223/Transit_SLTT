/** Terminologie métier unifiée — source unique pour libellés et tooltips UI. */

export const GLOSSARY = {
  margeDossier: {
    label: "Marge dossier",
    short: "Marge",
    definition:
      "Frais de prestation moins droits de douane et frais de circuit (marge opérationnelle du dossier).",
  },
  ecartReglement: {
    label: "Écart de règlement",
    short: "Écart règl.",
    definition:
      "Montant payé moins montant investi sur une écriture comptable (positif = trop-perçu, négatif = reste dû).",
  },
  resteAPayer: {
    label: "Reste à payer",
    short: "Reste",
    definition: "Solde impayé sur un dossier, une facture ou une écriture.",
  },
  margeBrutePeriode: {
    label: "Marge brute période",
    short: "Marge période",
    definition: "Somme des marges dossiers sur la période sélectionnée (tableau de bord / bilans).",
  },
  bl: {
    label: "N° de BL",
    short: "BL",
    definition:
      "Bill of Lading — document de transport maritime qui liste la marchandise expédiée.",
  },
  sousDossier: {
    label: "Sous-dossier",
    short: "Sous-doss.",
    definition:
      "Dossier virtuel pour classer vos pièces jointes (douane, livraison, BL…).",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
