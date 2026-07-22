/**
 * SEC-06: Escape HTML special characters to prevent injection in generated documents.
 * Exported so that screen-level printHTML templates escape user-entered data
 * (client names, notes, references…) instead of interpolating it raw.
 */
export function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
