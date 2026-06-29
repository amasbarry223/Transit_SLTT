"use client";

import { useEffect } from "react";
import { useNav, SESSION_TTL_SHORT, SESSION_TTL_LONG } from "@/lib/nav-store";
import { LoginScreen } from "@/components/sltt/screens/login";
import { AppShell } from "@/components/sltt/layout/app-shell";

export function AppRoot() {
  const isAuthenticated = useNav((s) => s.isAuthenticated);
  const loginAt = useNav((s) => s.loginAt);
  const rememberMe = useNav((s) => s.rememberMe);
  const logout = useNav((s) => s.logout);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Session sans loginAt = ancien format (avant refonte auth) → déconnexion forcée
    if (loginAt === null) {
      logout();
      return;
    }

    const ttl = rememberMe ? SESSION_TTL_LONG : SESSION_TTL_SHORT;
    const elapsed = Date.now() - loginAt;

    if (elapsed >= ttl) {
      logout();
      return;
    }

    const remaining = ttl - elapsed;
    const timer = setTimeout(logout, remaining);
    return () => clearTimeout(timer);
  }, [isAuthenticated, loginAt, rememberMe, logout]);

  return isAuthenticated ? <AppShell /> : <LoginScreen />;
}
