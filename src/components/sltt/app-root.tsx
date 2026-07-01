"use client";

import { useEffect, useRef } from "react";
import { useNav, SESSION_TTL_SHORT, SESSION_TTL_LONG } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { LoginScreen } from "@/components/sltt/screens/login";
import { AppShell } from "@/components/sltt/layout/app-shell";

export function AppRoot() {
  const isAuthenticated = useNav((s) => s.isAuthenticated);
  const loginAt = useNav((s) => s.loginAt);
  const rememberMe = useNav((s) => s.rememberMe);
  const logout = useNav((s) => s.logout);
  const fetchData = useStore((s) => s.fetchData);

  // PERF-05: Stabilize logout in a ref to avoid adding it to useEffect deps,
  // preventing the timer from being reset on every render where logout identity changes.
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Session sans loginAt = ancien format (avant refonte auth) → déconnexion forcée
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
  }, [isAuthenticated, loginAt, rememberMe]);

  return isAuthenticated ? <AppShell /> : <LoginScreen />;
}
