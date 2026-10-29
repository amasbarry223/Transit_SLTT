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
