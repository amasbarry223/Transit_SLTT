"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/lib/mock-data";

export type ViewKey =
  | "dashboard"
  | "dossiers"
  | "dossier-form"
  | "dossier-detail"
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
  currentRole: UserRole;
  currentUserName: string;
  go: (view: ViewKey, opts?: { id?: string | null }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
  openDossierDetail: (id: string) => void;
  openClient: (id: string | null) => void;
  login: (role?: UserRole, name?: string) => void;
  logout: () => void;
}

export const useNav = create<NavState>()(
  persist(
    (set) => ({
      view: "dashboard",
      selectedId: null,
      dossierFormMode: "create",
      isAuthenticated: false,
      currentRole: "Administrateur" as UserRole,
      currentUserName: "Amadou Traoré",
      go: (view, opts) => set({ view, selectedId: opts?.id ?? null }),
      openDossier: (id, mode = "edit") =>
        set({ view: "dossier-form", selectedId: id, dossierFormMode: mode }),
      openDossierDetail: (id) =>
        set({ view: "dossier-detail", selectedId: id }),
      openClient: (id) => set({ view: "client-fiche", selectedId: id }),
      login: (role = "Administrateur" as UserRole, name = "Amadou Traoré") =>
        set({ isAuthenticated: true, view: "dashboard", currentRole: role, currentUserName: name }),
      logout: () =>
        set({
          isAuthenticated: false,
          view: "dashboard",
          selectedId: null,
          currentRole: "Administrateur" as UserRole,
          currentUserName: "Amadou Traoré",
        }),
    }),
    {
      name: "sltt-auth",
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        currentRole: s.currentRole,
        currentUserName: s.currentUserName,
      }),
    },
  ),
);
