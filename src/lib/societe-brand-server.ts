/**
 * Nom de la société — variante serveur (metadata Next.js : manifest.ts,
 * layout.tsx) qui n'a pas accès au store Zustand. `societes` est un
 * singleton depuis le passage mono-société (idx_societes_singleton,
 * 20260915_sltt_mono_societe.sql) : plus besoin de la logique
 * resolveTransitSociete (flag is_transit, désormais retiré) — une seule
 * ligne existe toujours.
 *
 * Utilise le client admin (service role, contourne le RLS
 * `to authenticated`) car ce nom doit être lisible même par un visiteur pas
 * encore connecté (page de login, installation PWA). Ne jette jamais :
 * un souci de config/réseau ne doit pas faire tomber le layout racine —
 * repli silencieux sur "Transit", cohérent avec le repli déjà utilisé côté
 * client (resolveAppShellBranding, societe-brand.ts).
 *
 * Caché 5 min (unstable_cache) : sans ça, generateMetadata (layout racine —
 * englobe TOUTES les pages) et manifest.ts déclenchaient chacun un appel
 * Supabase à CHAQUE requête (RootLayout utilise déjà headers(), donc la
 * route entière est dynamique/non statique) pour une donnée qui ne change
 * quasiment jamais (renommage société = action admin rarissime, déjà
 * visible ailleurs via rechargement client du store).
 */
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logWarn } from "@/shared/logger";

const FALLBACK_NOM = "Transit";

const resolveSocieteNomCached = unstable_cache(
  async (): Promise<string> => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.from("societes").select("nom").limit(1).maybeSingle();
      if (error || !data?.nom) return FALLBACK_NOM;
      return data.nom;
    } catch (e) {
      logWarn("[societe-brand-server] Résolution du nom de société échouée, repli sur le nom par défaut", e);
      return FALLBACK_NOM;
    }
  },
  ["societe-nom-server"],
  { revalidate: 300, tags: ["societe-nom"] },
);

export async function resolveSocieteNomServer(): Promise<string> {
  return resolveSocieteNomCached();
}
