/** Filtre une collection par `societeId` ; sans id sélectionné, retourne la liste telle quelle. */
export function filterBySociete<T extends { societeId?: string | null }>(
  items: T[],
  societeId: string | null | undefined,
): T[] {
  if (!societeId) return items;
  return items.filter((x) => x.societeId === societeId);
}
