"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserRole } from "@/lib/domain-types";

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
  | "devis"
  | "devis-detail"
  | "calendrier"
  | "transporteurs"
  | "factures"
  | "facture-detail"
  | "fournisseurs"
  | "parametres";

/** TTL session sans "Rester connecté" : 8 heures */
export const SESSION_TTL_SHORT = 8 * 60 * 60 * 1000;
/** TTL session avec "Rester connecté" : 7 jours */
export const SESSION_TTL_LONG = 7 * 24 * 60 * 60 * 1000;

export type Theme = "light" | "dark";

interface NavState {
  view: ViewKey;
  selectedId: string | null;
  dossierFormMode: "create" | "edit";
  devisEditMode: boolean;
  isAuthenticated: boolean;
  currentRole: UserRole;
  currentUserName: string;
  currentUserId: string | null;
  loginAt: number | null;
  rememberMe: boolean;
  theme: Theme;
  go: (view: ViewKey, opts?: { id?: string | null }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
  openDossierDetail: (id: string) => void;
  openDevisDetail: (id: string, edit?: boolean) => void;
  openClient: (id: string | null) => void;
  login: (role: UserRole, name: string, userId: string, remember: boolean) => void;
  logout: () => Promise<void>;
  setCurrentUserName: (name: string) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const LOGGED_OUT = {
  isAuthenticated: false,
  currentRole: "Agent de transit" as UserRole,
  currentUserName: "",
  currentUserId: null as string | null,
  loginAt: null as number | null,
  rememberMe: false,
};

export const useNav = create<NavState>()(
  persist(
    (set) => ({
      view: "dashboard",
      selectedId: null,
      dossierFormMode: "create",
      devisEditMode: false,
      theme: "light",
      ...LOGGED_OUT,

      go: (view, opts) => set({ view, selectedId: opts?.id ?? null }),
      openDossier: (id, mode = "edit") =>
        set({ view: "dossier-form", selectedId: id, dossierFormMode: mode }),
      openDossierDetail: (id) =>
        set({ view: "dossier-detail", selectedId: id }),
      openDevisDetail: (id, edit = false) =>
        set({ view: "devis-detail", selectedId: id, devisEditMode: edit }),
      openClient: (id) => set({ view: "client-fiche", selectedId: id }),

      login: (role, name, userId, remember) =>
        set({
          isAuthenticated: true,
          view: "dashboard",
          currentRole: role,
          currentUserName: name,
          currentUserId: userId,
          loginAt: Date.now(),
          rememberMe: remember,
        }),

      logout: async () => {
        try {
          if (isSupabaseConfigured) {
            await supabase.auth.signOut();
          }
        } catch { /* ignore */ }
        set({
          ...LOGGED_OUT,
          view: "dashboard",
          selectedId: null,
          dossierFormMode: "create",
        });
      },

      setCurrentUserName: (name) => set({ currentUserName: name }),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "sltt-auth-v2",
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        currentRole: s.currentRole,
        currentUserName: s.currentUserName,
        currentUserId: s.currentUserId,
        loginAt: s.loginAt,
        rememberMe: s.rememberMe,
        theme: s.theme,
      }),
    },
  ),
);
