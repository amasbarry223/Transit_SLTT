/**
 * Palette institutionnelle — source unique des hex de marque.
 * Primary = bleu institutionnel · Secondary = rouge accent marque.
 */
export const BRAND = {
  /** Palette TRAORE DE LOGISTIQUE */
  navy: "#0B2A78",
  royal: "#1749C6",
  blue: "#2563EB",
  blueLight: "#EAF2FF",
  red: "#ED1C24",
  redLight: "#FFE8EA",
  background: "#F5F7FB",
  surface: "#FFFFFF",
  textPrimary: "#102A56",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#16A34A",
  white: "#FFFFFF",

  primary: "#1749C6",
  primaryHover: "#0B2A78",
  primaryLight: "#EAF2FF",
  secondary: "#ED1C24",
  secondaryHover: "#D9161E",
  secondaryLight: "#FFE8EA",
  warning: "#F59E0B",
  error: "#ED1C24",
  info: "#2563EB",
  darkBg: "#0B0F19",
  darkCard: "#111827",
  darkMuted: "#1F2937",
  darkBorder: "#273349",
  darkTextMuted: "#94A3B8",
  /** Alias legacy print / charts */
  sky: "#2563EB",
  canvas: "#F5F7FB",
} as const;

export const CHART_BRAND = {
  primary: BRAND.royal,
  secondary: BRAND.secondary,
  info: BRAND.blue,
  success: BRAND.success,
  warning: BRAND.warning,
  slate: "#64748B",
  navy: BRAND.navy,
  red: BRAND.secondary,
  sky: BRAND.blue,
  emerald: BRAND.success,
  amber: BRAND.warning,
} as const;

/** Alias historique — remplace SLTT_BLUE / #404089 */
export const SLTT_BLUE = BRAND.primary;
