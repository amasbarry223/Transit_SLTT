"use client";

import { LoginScreen } from "./login-screen";

/**
 * Remplacé lors de la migration vers NestJS + MySQL.
 * Renvoie désormais l'écran de connexion officiel.
 */
export function SupabaseRequiredScreen() {
  return <LoginScreen />;
}
