/**
 * Filtre une collection par `annexeId` ; sans id sélectionné ("Toutes les
 * annexes"), retourne la liste telle quelle. Filtre annexe partagé (topbar) —
 * la RLS restreint déjà les données aux annexes assignées à l'utilisateur.
 */
export function filterByAnnexe<T extends { annexeId?: string | null }>(
  items: T[],
  annexeId: string | null | undefined,
): T[] {
  if (!annexeId) return items;
  return items.filter((x) => x.annexeId === annexeId);
}
