/**
 * Pagination serveur Supabase — évite la troncature silencieuse à 1000 lignes
 * et le chargement OOM full-table.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const FETCH_PAGE_SIZE = 500;
/** Tables volumineuses : on plafonne le volume client. */
export const FETCH_SOFT_CAPS: Record<string, number> = {
  audit_logs: 2_000,
  documents: 1_000,
  document_versions: 2_000,
  ocr_jobs: 500,
  ocr_fields: 2_000,
  mouvements: 2_000,
};

type QueryBuilder = {
  range: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
};

/**
 * Charge une table par pages de FETCH_PAGE_SIZE jusqu'à soft cap ou fin.
 * Retourne { data, truncated, error }.
 */
export async function fetchAllPaged<T>(
  buildQuery: () => QueryBuilder,
  options?: { softCap?: number; pageSize?: number },
): Promise<{ data: T[]; truncated: boolean; error: Error | null }> {
  const pageSize = options?.pageSize ?? FETCH_PAGE_SIZE;
  const softCap = options?.softCap ?? Number.POSITIVE_INFINITY;
  const out: T[] = [];
  let from = 0;
  let truncated = false;

  while (out.length < softCap) {
    const to = Math.min(from + pageSize - 1, softCap - 1);
    const requested = to - from + 1;
    const { data, error } = await buildQuery().range(from, to);
    if (error) {
      return { data: out, truncated, error: new Error(error.message) };
    }
    const chunk = (data || []) as T[];
    out.push(...chunk);
    if (out.length >= softCap) {
      // Soft cap atteint : d'autres lignes peuvent exister côté serveur.
      truncated = true;
      break;
    }
    if (chunk.length < requested) break;
    from += pageSize;
  }

  return { data: out, truncated, error: null };
}

/** Helper typé pour supabase.from(...).select(...).order(...). */
export function pagedSelect(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any>,
  table: string,
  select: string,
  order?: { column: string; ascending?: boolean },
): QueryBuilder {
  let q = client.from(table).select(select);
  if (order) {
    q = q.order(order.column, { ascending: order.ascending ?? false });
  }
  return q as unknown as QueryBuilder;
}
