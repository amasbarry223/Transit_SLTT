"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { readLegacyNavPersist } from "@/lib/session/legacy-persist";

export type Theme = "light" | "dark";

interface UiPrefsState {
  theme: Theme;
  /** Filtre société partagé et mémorisé entre écrans (F1). null = "Toutes les sociétés". */
  selectedSocieteId: string | null;
  /** Annexe active — sous quelle annexe créer les nouveaux enregistrements. */
  selectedAnnexeId: string | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSelectedSocieteId: (id: string | null) => void;
  setSelectedAnnexeId: (id: string | null) => void;
}

function seedFromLegacy(): Partial<UiPrefsState> {
  const legacy = readLegacyNavPersist();
  if (!legacy) return {};
  return {
    theme: legacy.theme === "dark" ? "dark" : "light",
    selectedSocieteId: legacy.selectedSocieteId ?? null,
    selectedAnnexeId: legacy.selectedAnnexeId ?? null,
  };
}

export const useUiPrefs = create<UiPrefsState>()(
  persist(
    (set) => ({
      theme: "light",
      selectedSocieteId: null,
      selectedAnnexeId: null,
      ...seedFromLegacy(),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setSelectedSocieteId: (id) => set({ selectedSocieteId: id }),
      setSelectedAnnexeId: (id) => set({ selectedAnnexeId: id }),
    }),
    {
      name: "sltt-ui-prefs-v1",
      partialize: (s) => ({
        theme: s.theme,
        selectedSocieteId: s.selectedSocieteId,
        selectedAnnexeId: s.selectedAnnexeId,
      }),
    },
  ),
);
