import type { NextConfig } from "next";

// Origine Supabase dérivée de l'env — évite de coder en dur un projet précis
// et reste correcte si l'URL change entre environnements (dev/staging/prod).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseOrigin = supabaseUrl.replace(/\/$/, "");
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

// 'unsafe-inline' sur script-src est nécessaire pour l'unique script inline
// de l'app (anti-flash de thème dans app/layout.tsx, statique, sans donnée
// utilisateur) — le reste de la politique reste strict.
// 'unsafe-eval' n'est ajouté qu'en dev : le HMR webpack de `next dev` évalue
// du code via eval() pour les source maps, ce que la CSP bloque sinon (page
// bloquée sur "Vérification de la session…"). Absent en production.
const scriptSrc = ["'self'", "'unsafe-inline'"];
if (process.env.NODE_ENV === "development") {
  scriptSrc.push("'unsafe-eval'");
}

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  // Logos Storage + aperçus documents (signed URLs Supabase)
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWsOrigin} blob:`,
  "worker-src 'self' blob:",
  // Aperçu PDF / documents dans iframes (signed URL Storage)
  `frame-src 'self' blob: ${supabaseOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: csp },
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
