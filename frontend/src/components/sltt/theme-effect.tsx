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

  // Supprime l'icône de développement Next.js (le badge N) dès qu'il est injecté dans le DOM
  useEffect(() => {
    const hideNextDevTools = () => {
      const targets = document.querySelectorAll(
        "nextjs-portal, [data-nextjs-dev-tools-button], [data-indicator-status], #nextjs-dev-tools",
      );
      targets.forEach((el) => {
        const h = el as HTMLElement;
        h.style.setProperty("display", "none", "important");
        h.style.setProperty("visibility", "hidden", "important");
        h.style.setProperty("opacity", "0", "important");
        h.style.setProperty("pointer-events", "none", "important");
      });
    };

    hideNextDevTools();
    const observer = new MutationObserver(hideNextDevTools);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
