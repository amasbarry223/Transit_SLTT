"use client";

import { BRAND } from "@/lib/brand-colors";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { useEffect } from "react";

/** Applique/retire la classe `.dark` sur <html> d'après le thème du profil. */
export function ThemeEffect({ nonce: _nonce }: { nonce?: string }) {
  const theme = useUiPrefs((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme === "dark" ? BRAND.darkBg : BRAND.background);
  }, [theme]);

  return null;
}
