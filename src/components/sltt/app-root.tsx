"use client";

import { useNav } from "@/lib/nav-store";
import { LoginScreen } from "@/components/sltt/screens/login";
import { AppShell } from "@/components/sltt/layout/app-shell";

export function AppRoot() {
  const isAuthenticated = useNav((s) => s.isAuthenticated);
  return isAuthenticated ? <AppShell /> : <LoginScreen />;
}
