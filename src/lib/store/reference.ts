/** Padding numérique pour les suffixes de référence (ex. 0001). */
export function padSeq(n: number, len = 4): string {
  return String(n).padStart(len, "0");
}

/**
 * Référence annuelle standard : `PREFIX-YYYY-NNNN` (ex. FACT-2026-0001).
 * Pour les dossiers (`{societe}-TR-YYYY-NNNN`), composer à la main avec `padSeq`.
 */
export function nextYearlyReference(
  prefix: string,
  seq: number,
  len = 4,
  year = new Date().getFullYear(),
): string {
  return `${prefix}-${year}-${padSeq(seq, len)}`;
}

/**
 * Référence annuelle préfixée par le code d'annexe : `CODE-PREFIX-YYYY-NNNN`
 * (ex. ML-FACT-2026-0001, CI-DEVIS-2026-0003). Numérotation SLTT séparée par
 * annexe (§3 cahier des charges F-ANNEXE) — usage réservé aux sociétés qui
 * possèdent des annexes (`societes.is_transit`, cf. resolveDossierReferencePrefix).
 */
export function nextAnnexeYearlyReference(
  annexeCode: string,
  prefix: string,
  seq: number,
  len = 4,
  year = new Date().getFullYear(),
): string {
  return `${annexeCode}-${prefix}-${year}-${padSeq(seq, len)}`;
}

/** Extrait le suffixe numérique final d'une référence (ex. "...-0007" → 7). */
function extractTrailingSeq(ref: string): number | null {
  const match = ref.match(/-(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Prochaine séquence au sein d'un sous-ensemble de références déjà existantes
 * (ex. celles d'une annexe) — indépendante du compteur global de l'entité.
 * C'est ce qui garantit une numérotation ML-/CI- consécutive par annexe plutôt
 * qu'un simple partage du même compteur avec un préfixe différent.
 */
export function nextScopedSeq(
  refs: Array<string | null | undefined>,
  isInScope: (ref: string) => boolean,
): number {
  const max = refs
    .filter((r): r is string => !!r && isInScope(r))
    .map(extractTrailingSeq)
    .filter((n): n is number => n !== null)
    .reduce((acc, n) => Math.max(acc, n), 0);
  return max + 1;
}
