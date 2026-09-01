import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand-colors";
import { resolveSocieteNomServer } from "@/lib/societe-brand-server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const societeNom = await resolveSocieteNomServer();
  return {
    id: "/",
    name: `${societeNom} · Gestion logistique`,
    short_name: societeNom,
    description:
      "Plateforme de gestion logistique, transit douanier, comptabilité et entreposage.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    background_color: BRAND.background,
    theme_color: BRAND.primary,
    orientation: "any",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
