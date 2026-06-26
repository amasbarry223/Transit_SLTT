"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewKey =
  | "dashboard"
  | "dossiers"
  | "dossier-form"
  | "comptabilite"
  | "bilans"
  | "entreposage"
  | "bons"
  | "clients"
  | "client-fiche"
  | "parametres";

interface NavState {
  view: ViewKey;
  /** Optional context id (e.g. selected client, dossier) */
  selectedId: string | null;
  /** Whether the dossier form is in "create" vs "edit" mode */
  dossierFormMode: "create" | "edit";
  isAuthenticated: boolean;
  go: (view: ViewKey, opts?: { id?: string | null }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
  openClient: (id: string | null) => void;
  login: () => void;
  logout: () => void;
}

export const useNav = create<NavState>()(
  persist(
    (set) => ({
      view: "dashboard",
      selectedId: null,
      dossierFormMode: "create",
      isAuthenticated: false,
      go: (view, opts) => set({ view, selectedId: opts?.id ?? null }),
      openDossier: (id, mode = "edit") =>
        set({ view: "dossier-form", selectedId: id, dossierFormMode: mode }),
      openClient: (id) => set({ view: "client-fiche", selectedId: id }),
      login: () => set({ isAuthenticated: true, view: "dashboard" }),
      logout: () =>
        set({
          isAuthenticated: false,
          view: "dashboard",
          selectedId: null,
        }),
    }),
    {
      name: "sltt-auth",
      // Only persist the auth flag — not the current view/selection
      // (on reload we always land on the dashboard, never mid-edit)
      partialize: (s) => ({ isAuthenticated: s.isAuthenticated }),
    },
  ),
);
