"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_TIMEOUT, IDLE_WARNING_BEFORE, useSession } from "@/lib/session/session-store";
import { wipeStaleAppStorage } from "@/lib/session/legacy-persist";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { normalizeRole } from "@/lib/permissions";
import { LoginScreen } from "@/features/auth";
import { logWarn } from "@/shared/logger";
import { AppShell } from "@/components/sltt/layout/app-shell";
import { Loader2 } from "lucide-react";
import { UI } from "@/shared/utils/ui-messages";
import { Button } from "@/shared/components/ui/button";
import { toast } from "@/shared/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
const ACTIVITY_THROTTLE = 15 * 1000;
/** Garde-fou : ne jamais bloquer l'UI sur "Vérification de la session…". */
const AUTH_READY_TIMEOUT_MS = 4_000;
const PROFILE_QUERY_TIMEOUT_MS = 3_000;

/** Purge les Service Workers et caches pour forcer le chargement de la version propre. */
async function cleanupForeignServiceWorkers(): Promise<"reload" | "ok"> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return "ok";
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs.length > 0) {
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
    if (navigator.serviceWorker.controller && !sessionStorage.getItem("sltt-cache-cleaned-v1")) {
      sessionStorage.setItem("sltt-cache-cleaned-v1", "1");
      window.location.reload();
      return "reload";
    }
  } catch {
    /* ignore */
  }
  return "ok";
}

export function AppRoot() {
  return <AppRootInner />;
}

function AppRootInner() {
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const loginAt = useSession((s) => s.loginAt);
  const lastActivityAt = useSession((s) => s.lastActivityAt);
  const restoreSession = useSession((s) => s.restoreSession);
  const logout = useSession((s) => s.logout);
  const touchActivity = useSession((s) => s.touchActivity);
  const fetchData = useStore((s) => s.fetchData);
  const [authReady, setAuthReady] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  useEffect(() => {
    wipeStaleAppStorage();
  }, []);

  const logoutRef = useRef(logout);
  const restoreRef = useRef(restoreSession);
  useEffect(() => {
    logoutRef.current = logout;
    restoreRef.current = restoreSession;
  }, [logout, restoreSession]);

  // Déconnexion forcée quand un refresh de token échoue vraiment (session
  // expirée/révoquée côté serveur) : sans ça, l'utilisateur reste sur
  // isAuthenticated=true (état mémoire non synchronisé avec le localStorage
  // vidé par api-client) et voit le bandeau "chargement partiel" lister
  // les 18 ressources en échec au lieu d'être renvoyé à l'écran de connexion.
  useEffect(() => {
    api.setOnSessionExpired(() => {
      toast({ variant: "warning", description: UI.errors.session });
      void logoutRef.current();
    });
  }, []);

  // Synchronisation de session avec l'API NestJS
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      try {
        await cleanupForeignServiceWorkers();
        // Les tokens vivent en cookies httpOnly : plus lisibles en JS, donc
        // plus de "token présent" à vérifier localement. Un `user` en cache
        // restaure l'affichage optimistiquement (évite un flash de l'écran
        // de connexion) uniquement s'il y a un indice de session précédente ;
        // sans lui, un visiteur jamais connecté ne déclenche aucun appel
        // réseau ni le toast "session expirée" pour rien. La confirmation
        // serveur via /auth/me fait seule foi ensuite — son mécanisme de
        // retry-401 (voir request()) gère déjà le rafraîchissement silencieux
        // si seul l'access token a expiré, et onSessionExpired (déjà câblé
        // ci-dessus) gère déjà l'échec réel (refresh aussi invalide).
        const cachedUser = api.getCurrentUser();
        if (cachedUser && !cancelled) {
          restoreRef.current(normalizeRole(cachedUser.role), cachedUser.nom, cachedUser.id);
          try {
            const confirmed = await api.auth.me();
            if (!cancelled) {
              api.setSession({ user: confirmed });
              restoreRef.current(normalizeRole(confirmed.role), confirmed.nom, confirmed.id);
            }
          } catch {
            // Échec réel déjà géré par onSessionExpired (clearSession + toast + logout).
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          logWarn("[SLTT] Erreur init session NestJS", e);
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    }

    void initSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    void fetchData();
  }, [authReady, isAuthenticated, fetchData]);

  // Déconnexion pour inactivité (30 min). Un refresh remet le timer (mémoire).
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

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
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
