"use client";

import { useEffect, useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { useNav } from "@/lib/nav-store";

// Anti-flash : applique .dark avant le premier paint (lit le store persisté).
const THEME_INIT_SCRIPT = `try{var r=localStorage.getItem('sltt-auth-v2');var t=r?JSON.parse(r).state.theme:'light';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`;

/** Applique/retire la classe `.dark` sur <html> en fonction du thème persisté. */
export function ThemeEffect({ nonce }: { nonce?: string }) {
  const theme = useNav((s) => s.theme);
  const inserted = useRef(false);

  // Injecte le script hors de l'arbre React (évite le warning React 19 sur <script>).
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
    );
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
