import { useUiPrefs } from "@/lib/session/ui-prefs-store";

/**
 * Format a number as FCFA currency with thousands separators.
 * Example: 1250000 -> "1 250 000 FCFA"
 * Le libellé (FCFA/XOF — même monnaie, cf. Paramètres > Préférences) suit la
 * préférence utilisateur ; les montants eux-mêmes ne sont jamais convertis.
 */
export function formatFCFA(amount: number, withSymbol = true): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return withSymbol ? `${formatted} ${useUiPrefs.getState().currencyLabel}` : formatted;
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

/**
 * DX-03: Parse a "YYYY-MM-DD" date string at noon local time instead of
 * midnight UTC, so getFullYear()/getMonth()/getDate() never shift by a day
 * in timezones behind UTC. Datetime strings (containing "T") are parsed as-is.
 */
export function parseLocalDate(date: string): Date {
  return date.includes("T") ? new Date(date) : new Date(`${date}T12:00:00`);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Ordre jour/mois/année selon Paramètres > Préférences (JJ/MM/AAAA par défaut). */
function formatDatePart(d: Date): string {
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  switch (useUiPrefs.getState().dateFormat) {
    case "mdy":
      return `${mm}/${dd}/${yyyy}`;
    case "ymd":
      return `${yyyy}-${mm}-${dd}`;
    default:
      return `${dd}/${mm}/${yyyy}`;
  }
}

/** Format a date as "12/01/2026" (ou MM/JJ/AAAA, AAAA-MM-JJ selon préférence). Invalid/missing values return "—". */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d: Date = typeof date === "string" ? parseLocalDate(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDatePart(d);
}

/** Format a date+time as "12/01/2026 14:30" (date selon préférence). Invalid/missing values return "—". */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d: Date = typeof date === "string" ? parseLocalDate(date) : date;
  if (isNaN(d.getTime())) return "—";
  return `${formatDatePart(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Parse a user-typed number string (allow spaces) into a number.
 * DX-04: Returns 0 for negative values to reject invalid input.
 * Le FCFA n'a pas de sous-unité : arrondi à l'entier pour qu'un montant
 * fractionnaire saisi (ex. "1500.75") ne soit jamais persisté tel quel en
 * base alors que formatFCFA() l'arrondit déjà à l'affichage (Math.round ci-dessus).
 */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(/\s/g, "");
  const result = Number.parseFloat(cleaned.replace(",", ".")) || 0;
  return Math.max(0, Math.round(result));
}
