import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import withSerwistInit from "@serwist/next";
import withBundleAnalyzerInit from "@next/bundle-analyzer";
import { PROD_API_FALLBACK_URL } from "./src/lib/api/deployment-config.mjs";

let revision;
try {
  revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim();
} catch {}
if (!revision) {
  revision = crypto.randomUUID();
}

// Rapport de composition du bundle, désactivé par défaut : `ANALYZE=true npm run build`.
const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === "true",
});

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development" && process.env.SERWIST_DEV !== "1",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  globPublicPatterns: ["**/*", "!sw.js", "!sw.js.map"],
});

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const pwaHeaders = [
  { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
  { key: "Service-Worker-Allowed", value: "/" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  transpilePackages: [
    "@univerjs/presets",
    "@univerjs/preset-sheets-core",
    "@univerjs/core",
    "@univerjs/design",
    "@univerjs/engine-render",
    "@univerjs/engine-formula",
    "@univerjs/sheets",
    "@univerjs/sheets-ui",
    "@univerjs/sheets-formula",
    "@univerjs/sheets-formula-ui",
    "@univerjs/sheets-numfmt",
    "@univerjs/sheets-numfmt-ui",
    "@univerjs/docs",
    "@univerjs/docs-ui",
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      config.output = { ...config.output, chunkLoadTimeout: 240_000 };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: pwaHeaders,
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    // Cible du proxy same-origin (résout le problème de cookies cross-origin
    // en production quand front et API sont sur des domaines distincts : le
    // navigateur ne voit que l'origine du front, Next.js relaie vers le
    // backend réel côté serveur). Configurable via INTERNAL_API_URL — le repli
    // vient de deployment-config.mjs, source unique partagée avec server-api-url.ts.
    const apiTarget = (process.env.INTERNAL_API_URL || PROD_API_FALLBACK_URL).replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(withSerwist(nextConfig));
