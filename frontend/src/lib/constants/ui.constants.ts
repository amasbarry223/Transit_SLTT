/** Délais UI, couleurs chart et tokens visuels partagés. */
import { BRAND, CHART_BRAND } from "@/lib/brand-colors";

/** Délai avant reset d'un état « copié » (toast visuel). */
export const TOAST_COPY_RESET_MS = 2_500;

/** Palette chart — alignée sur brand-colors.ts */
export const CHART_COLORS = {
  blue: CHART_BRAND.primary,
  red: CHART_BRAND.secondary,
  sky: CHART_BRAND.info,
  emerald: CHART_BRAND.success,
  amber: CHART_BRAND.warning,
  indigo: "#4F46E5",
} as const;

/** Alias historique dashboard (réexport pour compatibilité). */
export const SLTT_BLUE = BRAND.primary;

/** Rayon SVG du ring de paiement (facture-detail). */
export const PAYMENT_RING_RADIUS_PX = 36;
