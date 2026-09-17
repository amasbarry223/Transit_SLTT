// Source unique de l'URL de repli du backend Hostinger — importée à la fois
// par next.config.mjs (rewrite proxy, exécuté par Node directement, sans
// passage par le compilateur TypeScript de l'app) et par server-api-url.ts.
// Avant ce fichier, la même URL était recopiée en dur indépendamment dans
// ces deux endroits, et a déjà divergé une fois (voir commit 37b2e35) — un
// seul des deux avait été mis à jour après un changement d'hébergement.
//
// Fichier .mjs (pas .ts) : next.config.mjs tourne en Node pur, avant toute
// compilation TypeScript, et ne peut importer que du JS/ESM nativement.
export const PROD_API_FALLBACK_URL = "https://goldenrod-newt-273291.hostingersite.com/api";
