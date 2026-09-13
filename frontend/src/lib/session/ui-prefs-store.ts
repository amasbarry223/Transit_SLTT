"use client";

import { create } from "zustand";
import { useSession } from "@/lib/session/session-store";

export type Theme = "light" | "dark";
/** dmy = JJ/MM/AAAA, mdy = MM/JJ/AAAA, ymd = AAAA-MM-JJ. */
export type DateFormat = "dmy" | "mdy" | "ymd";

export interface ProfileUiPrefs {
  theme: Theme;
  dateFormat: DateFormat;
  selectedAnnexeId: string | null;
  sidebarCollapsed?: boolean;
}

interface UiPrefsState extends ProfileUiPrefs {
  hydratePrefs: (prefs: ProfileUiPrefs) => void;
  resetPrefs: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSelectedAnnexeId: (id: string | null) => void;
  setDateFormat: (format: DateFormat) => void;
  toggleSidebar: () => void;
}

const DEFAULTS: ProfileUiPrefs = {
  theme: "light",
  selectedAnnexeId: null,
  dateFormat: "dmy",
  sidebarCollapsed: false,
};

type PrefsPatch = {
  theme?: Theme;
  date_format?: DateFormat;
  selected_annexe_id?: string | null;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPatch: PrefsPatch = {};

function cancelPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  pendingPatch = {};
}

function schedulePersist(patch: PrefsPatch) {
  pendingPatch = { ...pendingPatch, ...patch };
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const payload = pendingPatch;
    pendingPatch = {};
    persistTimer = null;

    if (typeof window !== "undefined") {
      try {
        const userId = useSession.getState().currentUserId;
        const key = userId ? `transit_sltt_prefs_${userId}` : "transit_sltt_prefs";
        const current = JSON.parse(localStorage.getItem(key) || "{}");
        localStorage.setItem(key, JSON.stringify({ ...current, ...payload }));
      } catch {
        /* ignore */
      }
    }
  }, 300);
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function isDateFormat(value: unknown): value is DateFormat {
  return value === "dmy" || value === "mdy" || value === "ymd";
}

export function prefsFromProfile(profile: {
  theme?: string | null;
  date_format?: string | null;
  selected_annexe_id?: string | null;
}): ProfileUiPrefs {
  return {
    theme: isTheme(profile.theme) ? profile.theme : DEFAULTS.theme,
    dateFormat: isDateFormat(profile.date_format) ? profile.date_format : DEFAULTS.dateFormat,
    selectedAnnexeId: profile.selected_annexe_id ?? null,
  };
}

export const useUiPrefs = create<UiPrefsState>()((set) => ({
  ...DEFAULTS,

  hydratePrefs: (prefs) => {
    cancelPersist();
    set(prefs);
  },
  resetPrefs: () => {
    cancelPersist();
    set(DEFAULTS);
  },

  setTheme: (theme) => {
    set({ theme });
    schedulePersist({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const theme: Theme = s.theme === "dark" ? "light" : "dark";
      schedulePersist({ theme });
      return { theme };
    }),
  setSelectedAnnexeId: (id) => {
    set({ selectedAnnexeId: id });
    schedulePersist({ selected_annexe_id: id });
  },
  setDateFormat: (dateFormat) => {
    set({ dateFormat });
    schedulePersist({ date_format: dateFormat });
  },
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("transit_sltt_sidebar_collapsed", next ? "1" : "0");
        } catch {
          /* ignore */
        }
      }
      return { sidebarCollapsed: next };
    }),
}));
