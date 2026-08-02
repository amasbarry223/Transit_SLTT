import type { NextConfig } from "next";

// Content-Security-Policy est construite dynamiquement dans middleware.ts
// (nonce par requête) — pas ici. Un script-src statique ne peut pas couvrir
// les <script> de streaming RSC que Next.js injecte lui-même (contenu
// différent à chaque requête), donc la CSP doit être posée là où le nonce
// est généré.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
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
    // Évite les erreurs 500 ENOSPC quand le disque C: est quasi plein (cache webpack).
    if (dev) config.cache = false;
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
