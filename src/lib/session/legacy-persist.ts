/** Lecture one-shot de l’ancien persist unifié `sltt-auth-v2` (avant Phase 4). */

const LEGACY_KEY = "sltt-auth-v2";

export type LegacyNavPersist = {
  isAuthenticated?: boolean;
  currentRole?: string;
  currentUserName?: string;
  currentUserId?: string | null;
  loginAt?: number | null;
  rememberMe?: boolean;
  lastActivityAt?: number | null;
  theme?: "light" | "dark";
  selectedSocieteId?: string | null;
  selectedAnnexeId?: string | null;
};

let cached: LegacyNavPersist | null | undefined;

export function readLegacyNavPersist(): LegacyNavPersist | null {
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") {
    cached = null;
    return null;
  }
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      cached = null;
      return null;
    }
    const parsed = JSON.parse(raw) as { state?: LegacyNavPersist } & LegacyNavPersist;
    cached = parsed.state ?? parsed;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function clearLegacyNavPersist(): void {
  cached = null;
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
