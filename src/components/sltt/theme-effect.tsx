"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";

import { useEffect, useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

// Anti-flash : applique .dark + la couleur de chrome mobile avant le premier
// paint (prefs v1, puis legacy auth-v2).
const THEME_INIT_SCRIPT = `try{var t='light';var r=localStorage.getItem('sltt-ui-prefs-v1');if(r){t=JSON.parse(r).state.theme||'light'}else{var o=localStorage.getItem('sltt-auth-v2');if(o)t=JSON.parse(o).state.theme||'light'}if(t==='dark'){document.documentElement.classList.add('dark')}var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'#0e0e1b':'#f8fafc')}catch(e){}`;

/** Applique/retire la classe `.dark` sur <html> en fonction du thème persisté. */
export function ThemeEffect({ nonce }: { nonce?: string }) {
  const theme = useUiPrefs((s) => s.theme);
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
    // La couleur de chrome mobile (barre d'adresse Android/iOS) suit le vrai
    // thème appliqué, pas seulement prefers-color-scheme (repli SSR statique
    // posé par `viewport` dans layout.tsx).
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme === "dark" ? "#0e0e1b" : "#f8fafc");
  }, [theme]);

  return null;
}
