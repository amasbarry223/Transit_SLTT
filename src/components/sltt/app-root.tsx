"use client";

import { useEffect, useRef, useState } from "react";
import { SESSION_TTL_SHORT, SESSION_TTL_LONG, IDLE_TIMEOUT, IDLE_WARNING_BEFORE, useSession } from "@/lib/session/session-store";
import { clearLegacyNavPersist } from "@/lib/session/legacy-persist";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { LoginScreen, SupabaseRequiredScreen } from "@/features/auth";
import { logWarn } from "@/shared/logger";
import { AppShell } from "@/components/sltt/layout/app-shell";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { Loader2 } from "lucide-react";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
const ACTIVITY_THROTTLE = 15 * 1000;
/** Garde-fou : ne jamais bloquer l'UI sur "Vérification de la session…". */
const AUTH_READY_TIMEOUT_MS = 4_000;
const PROFILE_QUERY_TIMEOUT_MS = 3_000;
const SW_FOREIGN_CLEARED_KEY = "sltt-sw-foreign-cleared";
const SLTT_SW_PATH = "/sw.js";

/** Désenregistre uniquement les SW étrangers (autres projets localhost), pas la PWA Transit. */
async function cleanupForeignServiceWorkers(): Promise<"reload" | "ok"> {
  if (!("serviceWorker" in navigator)) return "ok";
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    const foreign = regs.filter((reg) => {
      const scriptUrl =
        reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL;
      if (!scriptUrl) return false;
      return new URL(scriptUrl).pathname !== SLTT_SW_PATH;
    });
    if (foreign.length === 0) return "ok";

    await Promise.all(foreign.map((reg) => reg.unregister()));

    const controller = navigator.serviceWorker.controller;
    if (
      controller &&
      new URL(controller.scriptURL).pathname !== SLTT_SW_PATH &&
      !sessionStorage.getItem(SW_FOREIGN_CLEARED_KEY)
    ) {
      sessionStorage.setItem(SW_FOREIGN_CLEARED_KEY, "1");
      window.location.reload();
      return "reload";
    }
  } catch {
    /* ignore */
  }
  return "ok";
}

export function AppRoot() {
  if (!isSupabaseConfigured) {
    return <SupabaseRequiredScreen />;
  }

  return <AppRootInner />;
}

function AppRootInner() {
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const loginAt = useSession((s) => s.loginAt);
  const rememberMe = useSession((s) => s.rememberMe);
  const lastActivityAt = useSession((s) => s.lastActivityAt);
  const restoreSession = useSession((s) => s.restoreSession);
  const logout = useSession((s) => s.logout);
  const touchActivity = useSession((s) => s.touchActivity);
  const fetchData = useStore((s) => s.fetchData);
  const [authReady, setAuthReady] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  useEffect(() => {
    // Seed déjà lu en mémoire : on peut retirer l’ancien blob unifié.
    clearLegacyNavPersist();
  }, []);

  const logoutRef = useRef(logout);
  const restoreRef = useRef(restoreSession);
  useEffect(() => {
    logoutRef.current = logout;
    restoreRef.current = restoreSession;
  }, [logout, restoreSession]);

  // Aligne Zustand sur le JWT Supabase. Sans JWT, le RLS renvoie [] → écrans vides.
  useEffect(() => {
    let cancelled = false;
    let markedReady = false;
    let subscription: { unsubscribe: () => void } | null = null;

    function markReady() {
      if (cancelled || markedReady) return;
      markedReady = true;
      setAuthReady(true);
    }

    // Filet de sécurité : même si getSession / le réseau hang, afficher login/shell.
    const safetyTimer = setTimeout(() => {
      if (process.env.NODE_ENV === "development") {
        logWarn("[SLTT] Timeout sync session — déblocage UI");
      }
      markReady();
    }, AUTH_READY_TIMEOUT_MS);

    async function applyProfile(userId: string) {
      let lastError: string | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, nom, role, actif")
          .eq("id", userId)
          .abortSignal(AbortSignal.timeout(PROFILE_QUERY_TIMEOUT_MS))
          .maybeSingle();

        // Erreur réseau / temporaire : ne pas forcer un logout (évite boucle signOut).
        if (error) {
          lastError = error.message;
          if (
            /failed to fetch|networkerror|load failed|abort|timed out/i.test(error.message) &&
            attempt < 2
          ) {
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
            continue;
          }
          if (process.env.NODE_ENV === "development") {
            logWarn("[SLTT] Lecture profil", error, { message: error.message });
          }
          return false;
        }

        if (!profile || profile.actif === false) {
          await logoutRef.current();
          return false;
        }

        restoreRef.current(profile.role, profile.nom, profile.id);
        return true;
      }

      if (lastError && process.env.NODE_ENV === "development") {
        logWarn("[SLTT] Lecture profil", lastError);
      }
      return false;
    }

    async function handleSession(session: { user: { id: string } } | null) {
      if (!session?.user) {
        if (useSession.getState().isAuthenticated) {
          await logoutRef.current();
        }
        return;
      }
      await applyProfile(session.user.id);
    }

    async function boot() {
      // SW d'un autre projet sur localhost:3000 peut intercepter les fetch Supabase
      // et laisser getSession() / les requêtes pendantes à jamais.
      const swStatus = await cleanupForeignServiceWorkers();
      if (swStatus === "reload" || cancelled) return;

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        // Différer les appels Supabase pour éviter le deadlock du client auth.
        setTimeout(() => {
          void (async () => {
            if (cancelled) return;
            try {
              if (event === "INITIAL_SESSION") {
                await handleSession(session);
                markReady();
                return;
              }

              if (event === "SIGNED_OUT" || !session?.user) {
                if (useSession.getState().isAuthenticated) {
                  await logoutRef.current();
                }
                return;
              }

              if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                await applyProfile(session.user.id);
              }
            } catch (e) {
              if (process.env.NODE_ENV === "development") {
                logWarn("[SLTT] Auth state change", e);
              }
              if (event === "INITIAL_SESSION") markReady();
            }
          })();
        }, 0);
      });
      subscription = data.subscription;
      if (cancelled) {
        subscription.unsubscribe();
        return;
      }

      // Repli si INITIAL_SESSION n'arrive pas (réseau / init Auth bloquée).
      try {
        const result = await Promise.race([
          supabase.auth.getSession().then((r) => ({ ok: true as const, r })),
          new Promise<{ ok: false }>((resolve) =>
            setTimeout(() => resolve({ ok: false }), AUTH_READY_TIMEOUT_MS - 500),
          ),
        ]);

        if (cancelled || markedReady) return;

        if (result.ok) {
          if (result.r.error && process.env.NODE_ENV === "development") {
            logWarn("[SLTT] getSession", result.r.error, { message: result.r.error.message });
          }
          await handleSession(result.r.data.session);
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          logWarn("[SLTT] Sync session Auth", e);
        }
      } finally {
        markReady();
      }
    }

    void boot();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    void fetchData();
  }, [authReady, isAuthenticated, fetchData]);

  // Plafond absolu de la session (8h, ou 3 jours avec "Rester connecté").
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

  // Déconnexion pour inactivité (30 min), quel que soit "Rester connecté".
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastTouch = 0;
    function onActivity() {
      const now = Date.now();
      if (now - lastTouch < ACTIVITY_THROTTLE) return;
      lastTouch = now;
      touchActivity();
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [isAuthenticated, touchActivity]);

  useEffect(() => {
    // Pas besoin de réinitialiser showIdleWarning ici : le rendu du Dialog
    // (ligne ~230) le combine déjà avec `isAuthenticated`, donc une valeur
    // restée à true pendant la déconnexion n'affiche jamais rien à tort —
    // et cet effet la recalcule proprement dès la reconnexion.
    if (!authReady || !isAuthenticated) return;

    const reference = lastActivityAt ?? loginAt;
    if (reference === null) {
      logoutRef.current();
      return;
    }

    const remaining = IDLE_TIMEOUT - (Date.now() - reference);

    if (remaining <= 0) {
      // Idem : la déconnexion qui suit bascule isAuthenticated à false, ce
      // qui referme déjà le Dialog via son propre guard — pas besoin de
      // remettre showIdleWarning à false ici en plus.
      logoutRef.current();
      return;
    }

    // Contrairement aux deux cas ci-dessus, celui-ci est légitime : il fixe
    // l'état correct dès ce rendu (ex. l'onglet redevient actif alors que le
    // délai d'avertissement est déjà écoulé) plutôt que d'attendre le prochain
    // déclenchement de warningTimer ci-dessous — c'est une synchronisation
    // avec une horloge murale, pas un état dérivé de props/state à calculer
    // au rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowIdleWarning(remaining <= IDLE_WARNING_BEFORE);

    const warningTimer = setTimeout(
      () => setShowIdleWarning(true),
      Math.max(0, remaining - IDLE_WARNING_BEFORE),
    );
    const logoutTimer = setTimeout(() => logoutRef.current(), remaining);

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
    };
  }, [authReady, isAuthenticated, lastActivityAt, loginAt]);

  useSupabaseRealtime(authReady && isAuthenticated);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {UI.loading.verifying}
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? <AppShell /> : <LoginScreen />}

      <Dialog open={showIdleWarning && isAuthenticated}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Session bientôt expirée</DialogTitle>
            <DialogDescription>
              Vous allez être déconnecté(e) dans moins d&apos;une minute pour cause d&apos;inactivité.
              Cliquez ci-dessous pour rester connecté(e).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                touchActivity();
                setShowIdleWarning(false);
              }}
            >
              Rester connecté(e)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
