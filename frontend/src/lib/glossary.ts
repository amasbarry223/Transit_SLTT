/** Terminologie métier unifiée — source unique pour libellés et tooltips UI. */

export const GLOSSARY = {
  margeDossier: {
    label: "Bénéfice net",
    short: "Bénéfice net",
    definition: "Total contrat moins le total des dépenses du dossier (droit de douane compris).",
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
    label: "Bénéfice net période",
    short: "Bénéfice période",
    definition: "Somme des bénéfices nets des dossiers sur la période sélectionnée (tableau de bord / bilans).",
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
