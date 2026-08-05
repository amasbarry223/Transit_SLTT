"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { readLegacyNavPersist } from "@/lib/session/legacy-persist";

export type Theme = "light" | "dark";
/** dmy = JJ/MM/AAAA, mdy = MM/JJ/AAAA, ymd = AAAA-MM-JJ. */
export type DateFormat = "dmy" | "mdy" | "ymd";
/** Même monnaie (XOF = code ISO 4217 du franc CFA BCEAO) — n'affecte que le libellé affiché, jamais les montants. */
export type CurrencyLabel = "FCFA" | "XOF";

interface UiPrefsState {
  theme: Theme;
  /** Filtre société partagé et mémorisé entre écrans (F1). null = "Toutes les sociétés". */
  selectedSocieteId: string | null;
  /** Annexe active — sous quelle annexe créer les nouveaux enregistrements. */
  selectedAnnexeId: string | null;
  dateFormat: DateFormat;
  currencyLabel: CurrencyLabel;
  /**
   * Préférence enregistrée uniquement — aucun envoi d'e-mail n'est encore
   * câblé côté serveur. Sert à ne pas perdre le choix de l'utilisateur avant
   * qu'un système de notification existe pour la consulter.
   */
  notificationsEmail: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSelectedSocieteId: (id: string | null) => void;
  setSelectedAnnexeId: (id: string | null) => void;
  setDateFormat: (format: DateFormat) => void;
  setCurrencyLabel: (label: CurrencyLabel) => void;
  setNotificationsEmail: (enabled: boolean) => void;
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
      dateFormat: "dmy",
      currencyLabel: "FCFA",
      notificationsEmail: true,
      ...seedFromLegacy(),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setSelectedSocieteId: (id) => set({ selectedSocieteId: id }),
      setSelectedAnnexeId: (id) => set({ selectedAnnexeId: id }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setCurrencyLabel: (currencyLabel) => set({ currencyLabel }),
      setNotificationsEmail: (notificationsEmail) => set({ notificationsEmail }),
    }),
    {
      name: "sltt-ui-prefs-v1",
      partialize: (s) => ({
        theme: s.theme,
        selectedSocieteId: s.selectedSocieteId,
        selectedAnnexeId: s.selectedAnnexeId,
        dateFormat: s.dateFormat,
        currencyLabel: s.currencyLabel,
        notificationsEmail: s.notificationsEmail,
      }),
    },
  ),
);
