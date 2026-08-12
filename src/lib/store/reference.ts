import { DOSSIER_REFERENCE_PAD_LENGTH } from "@/lib/constants";

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
export function extractTrailingSeq(ref: string): number | null {
  const match = ref.match(/-(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Incrémente le suffixe numérique final d'une référence en conservant le
 * même nombre de chiffres (ex. "ML-FACT-2026-0007" → "ML-FACT-2026-0008").
 * Utilisé pour régénérer une référence candidate après une violation de
 * contrainte unique (deux créations concurrentes ayant calculé le même
 * numéro à partir d'un même snapshot client — la numérotation elle-même
 * reste calculée côté client, voir computeDossierReference/
 * computeAnnexeScopedReference ; ceci ne fait que réagir à un conflit déjà
 * détecté par la contrainte `unique` en base).
 */
export function bumpTrailingSeq(reference: string): string {
  return reference.replace(/(\d+)$/, (digits) => String(Number(digits) + 1).padStart(digits.length, "0"));
}

/** true si l'erreur Postgres/PostgREST est une violation de contrainte unique (23505). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

/**
 * Exécute `attemptInsert(reference)` en réessayant avec une référence
 * incrémentée si l'insertion échoue sur une violation de contrainte unique
 * (deux créations concurrentes ayant calculé la même référence). Sans ce
 * filet, la course se traduisait par une exception Postgres brute affichée
 * à l'utilisateur plutôt qu'une nouvelle tentative transparente.
 */
export async function insertWithReferenceRetry<T>(
  reference: string,
  attemptInsert: (ref: string) => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>,
  maxAttempts = 3,
): Promise<{ data: T; reference: string }> {
  let ref = reference;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await attemptInsert(ref);
    if (!error) return { data: data as T, reference: ref };
    if (!isUniqueViolation(error) || attempt === maxAttempts) throw error;
    ref = bumpTrailingSeq(ref);
  }
  throw new Error("Échec de génération de référence après plusieurs tentatives.");
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

/**
 * Référence "CODE-PREFIX-YYYY-NNNN" (société transit avec annexe) ou
 * "PREFIX-YYYY-NNNN" (globale) — logique commune aux bons de sortie,
 * factures et devis (numérotation par annexe si société transit, sinon
 * compteur global partagé). Même principe que `computeDossierReference` :
 * une seule implémentation, réutilisée aussi bien pour la génération réelle
 * que pour tout aperçu affiché avant sauvegarde, pour qu'ils ne divergent
 * jamais.
 */
export function computeAnnexeScopedReference(
  societe: { isTransit?: boolean } | undefined,
  annexe: { code: string } | undefined,
  prefix: string,
  existingRefs: Array<string | null | undefined>,
  globalSeq: number,
  year = new Date().getFullYear(),
): { reference: string; useAnnexeNumbering: boolean; seq: number } {
  const useAnnexeNumbering = Boolean(societe?.isTransit && annexe?.code);
  const seq = useAnnexeNumbering
    ? nextScopedSeq(existingRefs, (r) => r.startsWith(`${annexe!.code}-${prefix}-${year}-`))
    : globalSeq;
  const reference = useAnnexeNumbering
    ? nextAnnexeYearlyReference(annexe!.code, prefix, seq, 4, year)
    : nextYearlyReference(prefix, seq, 4, year);
  return { reference, useAnnexeNumbering, seq };
}

/**
 * Référence dossier pour un import historique (`importDossierHistorique`) :
 * contrairement à `computeDossierReference`, la séquence est TOUJOURS dérivée
 * des références existantes de l'année de la ligne importée — jamais du
 * compteur global `dossierSeq` (réservé aux dossiers créés aujourd'hui). Un
 * import de lignes 2019/2023 ne doit donc jamais faire avancer le prochain
 * numéro d'un dossier créé en 2026.
 */
export function computeHistoricalDossierReference(
  societe: { isTransit?: boolean } | undefined,
  annexe: { code: string } | undefined,
  prefix: string,
  existingRefs: Array<string | null | undefined>,
  year: number,
): { reference: string } {
  const useAnnexeNumbering = Boolean(societe?.isTransit && annexe?.code);
  const scopePrefix = useAnnexeNumbering
    ? `${prefix}-${annexe!.code}-TR-${year}-`
    : `${prefix}-TR-${year}-`;
  const seq = nextScopedSeq(existingRefs, (r) => r.startsWith(scopePrefix));
  const reference = useAnnexeNumbering
    ? `${prefix}-${annexe!.code}-TR-${year}-${padSeq(seq, DOSSIER_REFERENCE_PAD_LENGTH)}`
    : `${prefix}-TR-${year}-${padSeq(seq, DOSSIER_REFERENCE_PAD_LENGTH)}`;
  return { reference };
}

/**
 * Référence dossier (`{société}-TR-YYYY-NNNN`, ou `{société}-{ML|CI}-TR-YYYY-NNNN`
 * pour une société transit avec annexe — §5.2 cahier des charges). Logique
 * unique partagée entre la génération réelle (`addDossier`) et l'aperçu
 * affiché dans le formulaire de création : les deux doivent utiliser
 * exactement le même calcul pour ne jamais diverger (l'aperçu doit montrer
 * la référence qui sera vraiment attribuée à l'enregistrement).
 */
export function computeDossierReference(
  societe: { isTransit?: boolean } | undefined,
  annexe: { code: string } | undefined,
  prefix: string,
  existingRefs: Array<string | null | undefined>,
  dossierSeq: number,
  year = new Date().getFullYear(),
): { reference: string; useAnnexeNumbering: boolean; seq: number } {
  const useAnnexeNumbering = Boolean(societe?.isTransit && annexe?.code);
  const seq = useAnnexeNumbering
    ? nextScopedSeq(existingRefs, (r) => r.startsWith(`${prefix}-${annexe!.code}-TR-${year}-`))
    : dossierSeq;
  const reference = useAnnexeNumbering
    ? `${prefix}-${annexe!.code}-TR-${year}-${padSeq(seq, DOSSIER_REFERENCE_PAD_LENGTH)}`
    : `${prefix}-TR-${year}-${padSeq(seq, DOSSIER_REFERENCE_PAD_LENGTH)}`;
  return { reference, useAnnexeNumbering, seq };
}
