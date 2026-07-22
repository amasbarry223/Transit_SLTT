import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeEffect } from "@/components/sltt/theme-effect";

// Anti-flash : applique la classe .dark avant le premier paint, en lisant
// directement le store persisté (évite un éclair de thème clair au chargement).
const THEME_INIT_SCRIPT = `try{var r=localStorage.getItem('sltt-auth-v2');var t=r?JSON.parse(r).state.theme:'light';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Transit SLTT · Gestion logistique",
  description:
    "Plateforme de gestion logistique, transit douanier, comptabilité et entreposage.",
  keywords: [
    "transit",
    "logistique",
    "douane",
    "comptabilité",
    "entreposage",
    "UEMOA",
    "Mali",
  ],
  authors: [{ name: "Transit SLTT" }],
  icons: {
    icon: "/logoV.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} antialiased bg-background text-foreground`}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeEffect />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
