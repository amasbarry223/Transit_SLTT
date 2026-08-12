import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Sora } from "next/font/google";
import { BRAND } from "@/lib/brand-colors";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeEffect } from "@/components/sltt/theme-effect";
import { AppRoot } from "@/components/sltt/app-root";
import { AppSerwistProvider } from "@/components/pwa/serwist-provider";
import { PwaGlobalEffects } from "@/components/pwa/pwa-global-effects";

const APP_NAME = "Transit";
const APP_DEFAULT_TITLE = "Transit · Gestion logistique";
const APP_DESCRIPTION =
  "Plateforme de gestion logistique, transit douanier, comptabilité et entreposage.";

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
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  title: {
    default: APP_DEFAULT_TITLE,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "transit",
    "logistique",
    "douane",
    "comptabilité",
    "entreposage",
    "UEMOA",
    "Mali",
  ],
  authors: [{ name: APP_NAME }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logoV.png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
};

// Teinte la barre d'adresse/chrome des navigateurs mobiles (Android Chrome,
// iOS Safari) sur les couleurs de fond de l'app — ajustée dynamiquement au
// vrai thème appliqué (pas seulement à la préférence système) par ThemeEffect.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.background },
    { media: "(prefers-color-scheme: dark)", color: BRAND.darkBg },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce posé par middleware.ts (requis par la CSP script-src en production).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} antialiased bg-background text-foreground`}
      >
        <AppSerwistProvider>
          <ThemeEffect nonce={nonce} />
          {children}
          <AppRoot />
          <PwaGlobalEffects />
          <Toaster />
        </AppSerwistProvider>
      </body>
    </html>
  );
}
