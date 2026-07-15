"use client";

import { useMemo, useState } from "react";

/** Vrai si `query` est vide, ou si l'un des champs de `item` la contient (insensible à la casse). */
export function matchesQuery<T>(item: T, fields: (keyof T)[], query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => String(item[f] ?? "").toLowerCase().includes(q));
}

/** Recherche texte simple sur une liste, sans autre filtre combiné. */
export function useSearchFilter<T>(list: T[], fields: (keyof T)[]) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => list.filter((item) => matchesQuery(item, fields, search.trim())),
    [list, fields, search],
  );
  return { search, setSearch, filtered };
}
