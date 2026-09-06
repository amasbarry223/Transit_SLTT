"use client";

import { create } from "zustand";
import type { UserRole } from "@/lib/domain-types";
import { useNav } from "@/lib/nav-store";

/** Déconnexion après cette durée d'inactivité. */
export const IDLE_TIMEOUT = 30 * 60 * 1000;
/** Délai d'avertissement avant la déconnexion pour inactivité */
export const IDLE_WARNING_BEFORE = 60 * 1000;

interface SessionState {
  isAuthenticated: boolean;
  currentRole: UserRole;
  currentUserName: string;
  currentUserId: string | null;
  loginAt: number | null;
  lastActivityAt: number | null;
  login: (role: UserRole, name: string, userId: string) => void;
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
  lastActivityAt: null as number | null,
};

export const useSession = create<SessionState>()((set) => ({
  ...LOGGED_OUT,

  login: (role, name, userId) => {
    useNav.getState().resetNavigation();
    set({
      isAuthenticated: true,
      currentRole: role,
      currentUserName: name,
      currentUserId: userId,
      loginAt: Date.now(),
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

    try {
      const { api } = await import("@/lib/api-client");
      await api.auth.logout();
    } catch {
      /* ignore */
    }
  },

  touchActivity: () => set({ lastActivityAt: Date.now() }),

  setCurrentUserName: (name) => set({ currentUserName: name }),
}));
