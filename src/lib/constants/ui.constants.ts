/** Délais UI, couleurs chart et tokens visuels partagés. */

/** Délai avant reset d'un état « copié » (toast visuel). */
export const TOAST_COPY_RESET_MS = 2_500;

/** Délai d'animation d'entrée des listes / écrans. */
export const UI_LOAD_DELAY_MS = 300;

/** Palette chart SLTT — alignée sur globals.css (--primary, --chart-2). */
export const CHART_COLORS = {
  blue: "#1E40AF",
  emerald: "#059669",
  amber: "#D97706",
  red: "#DC2626",
  indigo: "#2563EB",
} as const;

/** Alias historiques dashboard (réexport pour compatibilité). */
export const SLTT_BLUE = CHART_COLORS.blue;
export const SLTT_EMERALD = CHART_COLORS.emerald;
export const SLTT_AMBER = CHART_COLORS.amber;

/** Rayon SVG du ring de paiement (facture-detail). */
export const PAYMENT_RING_RADIUS_PX = 36;
