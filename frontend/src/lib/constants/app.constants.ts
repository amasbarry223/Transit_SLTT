/** Durées calendaires et seuils métier partagés. */

export const MS_PER_DAY = 86_400_000;

/** Jours avant échéance considérés comme « imminents » (alerte ambre). */
export const ECHEANCE_IMMINENTE_JOURS = 3;

/** Délai par défaut avant échéance d'une facture (jours). */
export const FACTURE_ECHEANCE_JOURS = 30;

/** Nombre de mois affichés sur les graphiques dashboard / bilans. */
export const CHART_MONTHS_COUNT = 6;

/** Décalage mois pour construire la série (index 0 = il y a N-1 mois). */
export const CHART_MONTHS_OFFSET = CHART_MONTHS_COUNT - 1;

/** Mode de paiement par défaut (écritures, transitions dossier). */
export const DEFAULT_PAIEMENT_MODE = "Virement" as const;

/** Statuts dossier utilisés dans les transitions et la création. */
export const DOSSIER_STATUT_EN_COURS = "En cours" as const;
export const DOSSIER_STATUT_DEDOUANE = "Dédouané" as const;
export const DOSSIER_STATUT_SOLDE = "Soldé" as const;

/** Longueur du suffixe numérique des références dossier (ex. SLTT-TR-2026-0001). */
export const DOSSIER_REFERENCE_PAD_LENGTH = 4;
