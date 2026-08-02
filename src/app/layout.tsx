import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeEffect } from "@/components/sltt/theme-effect";

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
  title: "Transit · Gestion logistique",
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
  authors: [{ name: "Transit" }],
  icons: {
    icon: "/logoV.png",
  },
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
        <ThemeEffect nonce={nonce} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
