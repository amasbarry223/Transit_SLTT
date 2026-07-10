/** Ancrage calendaire dashboard : toujours aujourd'hui (minuit local). */
export function getDashboardAnchorDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
