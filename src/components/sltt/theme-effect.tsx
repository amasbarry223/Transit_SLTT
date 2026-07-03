"use client";

import { useEffect } from "react";
import { useNav } from "@/lib/nav-store";

/** Applique/retire la classe `.dark` sur <html> en fonction du thème persisté. */
export function ThemeEffect() {
  const theme = useNav((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
