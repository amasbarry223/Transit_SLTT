/**
 * Palette institutionnelle — source unique des hex de marque.
 * Primary = bleu institutionnel · Secondary = rouge accent marque.
 */
export const BRAND = {
  primary: "#2D348C",
  primaryHover: "#252B73",
  primaryLight: "#E8EAFB",
  secondary: "#EB2727",
  secondaryHover: "#C91F27",
  secondaryLight: "#FDE8E8",
  background: "#F8F9FC",
  surface: "#FFFFFF",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#2563EB",
  darkBg: "#15161C",
  darkCard: "#1E2028",
  darkMuted: "#292C37",
  darkBorder: "#343948",
  darkTextMuted: "#9DA2B3",
  /** Alias legacy print / charts */
  navy: "#2D348C",
  red: "#EB2727",
  sky: "#2563EB",
  canvas: "#F8F9FC",
  white: "#FFFFFF",
} as const;

export const CHART_BRAND = {
  primary: BRAND.primary,
  secondary: BRAND.secondary,
  info: BRAND.info,
  success: BRAND.success,
  warning: BRAND.warning,
  slate: "#92A3BA",
  navy: BRAND.primary,
  red: BRAND.secondary,
  sky: BRAND.info,
  emerald: BRAND.success,
  amber: BRAND.warning,
} as const;

/** Alias historique — remplace SLTT_BLUE / #404089 */
export const SLTT_BLUE = BRAND.primary;
