import { useMemo } from "react";

/** Pagination dérivée d'une liste déjà filtrée — logique partagée entre tous les écrans paginés. */
export function usePagination<T>(items: T[], page: number, pageSize: number) {
  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);
    const startIdx = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endIdx = Math.min(safePage * pageSize, items.length);
    return { totalPages, safePage, paged, startIdx, endIdx };
  }, [items, page, pageSize]);
}
