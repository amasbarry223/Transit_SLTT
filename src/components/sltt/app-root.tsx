"use client";

import { useEffect, useRef, useState } from "react";
import { useNav, SESSION_TTL_SHORT, SESSION_TTL_LONG } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { LoginScreen } from "@/components/sltt/screens/login";
import { SupabaseRequiredScreen } from "@/components/sltt/screens/supabase-required";
import { AppShell } from "@/components/sltt/layout/app-shell";
import { useSupabaseRealtime } from "@/lib/use-supabase-realtime";
import { Loader2 } from "lucide-react";

export function AppRoot() {
  if (!isSupabaseConfigured) {
    return <SupabaseRequiredScreen />;
  }

  return <AppRootInner />;
}

function AppRootInner() {
  const isAuthenticated = useNav((s) => s.isAuthenticated);
  const loginAt = useNav((s) => s.loginAt);
  const rememberMe = useNav((s) => s.rememberMe);
  const restoreSession = useNav((s) => s.restoreSession);
  const logout = useNav((s) => s.logout);
  const fetchData = useStore((s) => s.fetchData);
  const [authReady, setAuthReady] = useState(false);

  const logoutRef = useRef(logout);
  const restoreRef = useRef(restoreSession);
  useEffect(() => {
    logoutRef.current = logout;
    restoreRef.current = restoreSession;
  }, [logout, restoreSession]);

  // Aligne Zustand sur le JWT Supabase. Sans JWT, le RLS renvoie [] → écrans vides.
  useEffect(() => {
    let cancelled = false;

    async function applyProfile(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, nom, role, actif")
        .eq("id", userId)
        .maybeSingle();

      if (!profile || profile.actif === false) {
        await logoutRef.current();
        return false;
      }

      restoreRef.current(profile.role, profile.nom, profile.id);
      return true;
    }

    async function syncSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (!session?.user) {
          if (useNav.getState().isAuthenticated) {
            await logoutRef.current();
          }
          return;
        }

        await applyProfile(session.user.id);
      } catch (e) {
        console.error("[SLTT] Sync session Auth:", e);
        if (useNav.getState().isAuthenticated) {
          await logoutRef.current();
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      // Différer les appels Supabase pour éviter le deadlock du client auth.
      setTimeout(() => {
        void (async () => {
          if (event === "SIGNED_OUT" || !session?.user) {
            if (useNav.getState().isAuthenticated) {
              await logoutRef.current();
            }
            return;
          }

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await applyProfile(session.user.id);
          }
        })();
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    void fetchData();
  }, [authReady, isAuthenticated, fetchData]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    if (loginAt === null) {
      logoutRef.current();
      return;
    }

    const ttl = rememberMe ? SESSION_TTL_LONG : SESSION_TTL_SHORT;
    const elapsed = Date.now() - loginAt;

    if (elapsed >= ttl) {
      logoutRef.current();
      return;
    }

    const remaining = ttl - elapsed;
    const timer = setTimeout(() => logoutRef.current(), remaining);
    return () => clearTimeout(timer);
  }, [authReady, isAuthenticated, loginAt, rememberMe]);

  useSupabaseRealtime(authReady && isAuthenticated);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Vérification de la session…
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AppShell /> : <LoginScreen />;
}
