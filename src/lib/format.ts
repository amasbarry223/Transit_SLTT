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

/** Format a date as "12/01/2026"
 * DX-03: Plain date strings (YYYY-MM-DD) get noon local time to avoid timezone off-by-one.
 *        Datetime strings (containing "T") are parsed as-is. Invalid/missing values return "—".
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  let d: Date;
  if (typeof date === "string") {
    d = date.includes("T") ? new Date(date) : new Date(date + "T12:00:00");
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Parse a user-typed number string (allow spaces) into a number.
 * DX-04: Returns 0 for negative values to reject invalid input.
 */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(/\s/g, "");
  const result = Number.parseFloat(cleaned.replace(",", ".")) || 0;
  return Math.max(0, result);
}
