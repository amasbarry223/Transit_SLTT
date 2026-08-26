/** Ancrage calendaire dashboard : toujours aujourd'hui (minuit local). */
export function getDashboardAnchorDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Clé stable (jour local, YYYY-MM-DD) pour dépendance de useMemo — appeler
 * getDashboardAnchorDate() directement dans un tableau de deps casse la
 * mémoïsation (nouvelle référence Date à chaque rendu, identique en valeur).
 */
export function getDashboardAnchorDayKey(): string {
  const d = getDashboardAnchorDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
