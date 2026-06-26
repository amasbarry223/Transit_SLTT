/**
 * Format a number as FCFA currency with thousands separators.
 * Example: 1250000 -> "1 250 000 FCFA"
 */
export function formatFCFA(amount: number, withSymbol = true): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return withSymbol ? `${formatted} FCFA` : formatted;
}

/** Compact FCFA for KPI cards: 8 750 000 -> "8,75 M" */
export function formatFCFACompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
    })} M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} k`;
  }
  return new Intl.NumberFormat("fr-FR").format(amount);
}

/** Format a date as "12 janv. 2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format a date as "12/01/2026" */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Parse a user-typed number string (allow spaces) into a number */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(/\s/g, "");
  return Number.parseFloat(cleaned.replace(",", ".")) || 0;
}
