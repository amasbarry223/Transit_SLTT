import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  title: "SLTT · Société Traoré de Logistique, Transit et Transport",
  description:
    "Plateforme de gestion logistique, transit douanier, comptabilité et entreposage — Société Traoré de Logistique, Transit et Transport.",
  keywords: [
    "SLTT",
    "transit",
    "logistique",
    "douane",
    "comptabilité",
    "entreposage",
    "UEMOA",
    "Mali",
  ],
  authors: [{ name: "SLTT" }],
  icons: {
    icon: "/logo.svg",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
