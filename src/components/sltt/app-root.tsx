"use client";

import { useEffect, useRef } from "react";
import { useNav, SESSION_TTL_SHORT, SESSION_TTL_LONG } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { LoginScreen } from "@/components/sltt/screens/login";
import { SupabaseRequiredScreen } from "@/components/sltt/screens/supabase-required";
import { AppShell } from "@/components/sltt/layout/app-shell";
import { useSupabaseRealtime } from "@/lib/use-supabase-realtime";

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
  const logout = useNav((s) => s.logout);
  const fetchData = useStore((s) => s.fetchData);

  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (!isAuthenticated) return;

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

  useSupabaseRealtime(isAuthenticated);

  return isAuthenticated ? <AppShell /> : <LoginScreen />;
}
