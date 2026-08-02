#!/usr/bin/env node
/**
 * Charge supabase_seed.sql (données fictives) — JAMAIS en CI/prod.
 * Usage : npm run db:seed:demo -- --confirm
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedFile = join(root, "supabase_seed.sql");

if (!process.argv.includes("--confirm")) {
  console.error("");
  console.error("  SEED DÉMO — données fictives (clients, dossiers, factures…).");
  console.error("  Refusé sans --confirm. Ne pas utiliser en production.");
  console.error("");
  console.error("  Usage : npm run db:seed:demo -- --confirm");
  console.error("");
  process.exit(1);
}

if (!existsSync(seedFile)) {
  console.error(`Fichier introuvable : ${seedFile}`);
  process.exit(1);
}

// --local forcé en dur : sans ça, une CLI "supabase link"-ée sur un projet
// distant exécuterait ce seed fictif directement sur ce projet (prod comprise),
// malgré l'avertissement ci-dessus. Le seed démo ne doit jamais pouvoir
// atteindre autre chose que le stack Supabase local.
const result = spawnSync(
  "npx",
  ["supabase", "db", "query", "--local", "-f", seedFile],
  { cwd: root, stdio: "inherit", shell: true },
);

if (result.error) {
  console.error(result.error.message);
  console.error("Astuce : `supabase start` doit tourner localement (stack Docker) pour ce seed.");
  process.exit(1);
}

process.exit(result.status ?? 1);
