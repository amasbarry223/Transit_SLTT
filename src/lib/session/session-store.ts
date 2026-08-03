"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserRole } from "@/lib/domain-types";
import { readLegacyNavPersist } from "@/lib/session/legacy-persist";
import { useNav } from "@/lib/nav-store";

/** TTL session sans "Rester connecté" : 8 heures (plafond absolu, voir IDLE_TIMEOUT pour la déconnexion réelle) */
export const SESSION_TTL_SHORT = 8 * 60 * 60 * 1000;
/** TTL session avec "Rester connecté" : 3 jours (réduit de 7 jours pour limiter la fenêtre d'exposition) */
export const SESSION_TTL_LONG = 3 * 24 * 60 * 60 * 1000;
/** Déconnexion après cette durée d'inactivité, quelle que soit l'option "Rester connecté" */
export const IDLE_TIMEOUT = 30 * 60 * 1000;
/** Délai d'avertissement avant la déconnexion pour inactivité */
export const IDLE_WARNING_BEFORE = 60 * 1000;

interface SessionState {
  isAuthenticated: boolean;
  currentRole: UserRole;
  currentUserName: string;
  currentUserId: string | null;
  loginAt: number | null;
  rememberMe: boolean;
  lastActivityAt: number | null;
  login: (role: UserRole, name: string, userId: string, remember: boolean) => void;
  /** Restaure la session sans réinitialiser la vue courante. */
  restoreSession: (role: UserRole, name: string, userId: string) => void;
  logout: () => Promise<void>;
  /** Marque une activité utilisateur, ce qui repousse la déconnexion pour inactivité. */
  touchActivity: () => void;
  setCurrentUserName: (name: string) => void;
}

const LOGGED_OUT = {
  isAuthenticated: false,
  currentRole: "Agent de transit" as UserRole,
  currentUserName: "",
  currentUserId: null as string | null,
  loginAt: null as number | null,
  rememberMe: false,
  lastActivityAt: null as number | null,
};

function seedFromLegacy(): Partial<SessionState> {
  const legacy = readLegacyNavPersist();
  if (!legacy) return {};
  return {
    isAuthenticated: !!legacy.isAuthenticated,
    currentRole: (legacy.currentRole as UserRole | undefined) ?? LOGGED_OUT.currentRole,
    currentUserName: legacy.currentUserName ?? "",
    currentUserId: legacy.currentUserId ?? null,
    loginAt: legacy.loginAt ?? null,
    rememberMe: !!legacy.rememberMe,
    lastActivityAt: legacy.lastActivityAt ?? null,
  };
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      ...LOGGED_OUT,
      ...seedFromLegacy(),

      login: (role, name, userId, remember) => {
        useNav.getState().resetNavigation();
        set({
          isAuthenticated: true,
          currentRole: role,
          currentUserName: name,
          currentUserId: userId,
          loginAt: Date.now(),
          rememberMe: remember,
          lastActivityAt: Date.now(),
        });
      },

      restoreSession: (role, name, userId) =>
        set((s) => ({
          isAuthenticated: true,
          currentRole: role,
          currentUserName: name,
          currentUserId: userId,
          loginAt: s.loginAt ?? Date.now(),
          lastActivityAt: s.lastActivityAt ?? Date.now(),
        })),

      logout: async () => {
        set({ ...LOGGED_OUT });
        useNav.getState().resetNavigation();

        if (!isSupabaseConfigured) return;

        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          /* ignore */
        }

        void supabase.auth.signOut({ scope: "global" }).catch(() => undefined);
      },

      touchActivity: () => set({ lastActivityAt: Date.now() }),

      setCurrentUserName: (name) => set({ currentUserName: name }),
    }),
    {
      name: "sltt-session-v1",
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        currentRole: s.currentRole,
        currentUserName: s.currentUserName,
        currentUserId: s.currentUserId,
        loginAt: s.loginAt,
        rememberMe: s.rememberMe,
        lastActivityAt: s.lastActivityAt,
      }),
    },
  ),
);
