/**
 * Filtre une collection par `annexeId` ; sans id sélectionné ("Toutes les
 * annexes"), retourne la liste telle quelle. Pendant de filterBySociete,
 * pour le filtre annexe partagé (topbar) — la RLS restreint déjà les
 * données aux annexes assignées à l'utilisateur, ce filtre ne fait que
 * permettre d'isoler la vue d'une seule annexe pour la traçabilité.
 */
export function filterByAnnexe<T extends { annexeId?: string | null }>(
  items: T[],
  annexeId: string | null | undefined,
): T[] {
  if (!annexeId) return items;
  return items.filter((x) => x.annexeId === annexeId);
}
