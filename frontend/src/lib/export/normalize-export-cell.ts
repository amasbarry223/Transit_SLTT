/** Normalise une valeur de cellule pour l'export tabulaire (JSON-safe). */
export function normalizeExportCell(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/** Normalise une matrice de lignes exportées. */
export function normalizeExportRows(
  rows: unknown[][],
  columnCount: number,
): (string | number)[][] {
  return rows.map((row) => {
    const cells = Array.isArray(row) ? row : [];
    return Array.from({ length: columnCount }, (_, i) =>
      normalizeExportCell(cells[i]),
    );
  });
}
