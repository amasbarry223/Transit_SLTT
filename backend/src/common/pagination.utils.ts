export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Normalise les paramètres de pagination (page >= 1, 1 <= limit <= 100).
 * Calcule le skip pour Prisma.
 */
export function parsePagination(query: PaginationQuery = {}, defaultLimit = 20): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Construit la structure standardisée de réponse paginée.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: { page: number; limit: number },
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit) || 1,
    },
  };
}
