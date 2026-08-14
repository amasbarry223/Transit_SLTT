/** Soft caps for entity fetch pagination (client-side). */
export const FETCH_ENTITY_SOFT_CAPS = {
  default: 2_000,
  profiles: 500,
  societes: 100,
  annexes: 100,
  userAnnexes: 5_000,
  transporteurs: 1_000,
  archives: 1_000,
  operationsComptables: 5_000,
  cloturesCaisse: 500,
  recusPaiement: 5_000,
} as const;

/** Signed URL expiry for Supabase storage (1 hour). */
export const SIGNED_URL_TTL_SEC = 3600;

/** Recovery rate color thresholds (percent). */
export const RECOVERY_RATE_THRESHOLDS = {
  good: 80,
  medium: 50,
} as const;

/** Returns recovery rate color token based on percentage. */
export function getRecoveryRateColor(rate: number): "emerald" | "amber" | "red" {
  if (rate >= RECOVERY_RATE_THRESHOLDS.good) return "emerald";
  if (rate >= RECOVERY_RATE_THRESHOLDS.medium) return "amber";
  return "red";
}
