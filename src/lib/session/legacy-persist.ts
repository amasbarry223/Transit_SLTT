/** One-shot wipe of pre-DB Zustand persist keys. JWT Auth (`sb-*-auth-token`) is left intact. */

const STALE_KEYS = [
  "sltt-session-v1",
  "sltt-ui-prefs-v1",
  "sltt-data-v9",
  "sltt-data-v10",
  "sltt-auth-v2",
  "sltt-guide-dismissed-v1",
] as const;

export function wipeStaleAppStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of STALE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
