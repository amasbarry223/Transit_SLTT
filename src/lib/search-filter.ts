/** Vrai si `query` est vide, ou si l'un des champs de `item` la contient (insensible à la casse). */
export function matchesQuery<T>(item: T, fields: (keyof T)[], query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => String(item[f] ?? "").toLowerCase().includes(q));
}
