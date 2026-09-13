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

/** Fenêtre du graphique de trésorerie (Entrées/Sorties) — 12 mois, un flux de
 *  trésorerie se lit habituellement sur un an. Volontairement distinct de
 *  CHART_MONTHS_COUNT (6, partagé par les autres graphiques dashboard) :
 *  ne pas les fusionner sous peine de changer silencieusement la fenêtre des
 *  sparklines si ce nombre est un jour ajusté. */
export const TRESORERIE_CHART_MONTHS_COUNT = 12;
export const TRESORERIE_CHART_MONTHS_OFFSET = TRESORERIE_CHART_MONTHS_COUNT - 1;

/** Statuts dossier utilisés dans les transitions et la création. */
export const DOSSIER_STATUT_EN_COURS = "En cours" as const;
export const DOSSIER_STATUT_DEDOUANE = "Dédouané" as const;
export const DOSSIER_STATUT_SOLDE = "Soldé" as const;

/** Longueur du suffixe numérique des références dossier (ex. SLTT-TR-2026-0001). */
export const DOSSIER_REFERENCE_PAD_LENGTH = 4;

/** Seuil d'alerte "stock faible" par défaut pour un nouvel article — repris
 *  à l'identique dans new-item-dialog.tsx, edit-item-dialog.tsx et
 *  stock-bulk-import-dialog.tsx avant centralisation ici. */
export const DEFAULT_STOCK_SEUIL = 10;

/** Déconnexion après cette durée d'inactivité. */
export const IDLE_TIMEOUT = 30 * 60 * 1000;
/** Délai d'avertissement avant la déconnexion pour inactivité. */
export const IDLE_WARNING_BEFORE = 60 * 1000;
