"use client";

import { Database, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SupabaseRequiredScreen() {
  // En production, un utilisateur final ne doit jamais voir de détails
  // techniques (noms de variables d'env, instructions .env.local) — ce cas
  // ne peut venir que d'un déploiement mal configuré, pas d'une action de
  // l'utilisateur. Le détail technique reste réservé au développement local.
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <Card className="max-w-lg border-border/80 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Database className="size-6" />
          </div>
          {isDev ? (
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Configuration Supabase requise
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Cette application fonctionne exclusivement avec une base de données Supabase.
                Aucune donnée fictive n&apos;est embarquée dans le frontend.
              </p>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  Variables d&apos;environnement manquantes
                </p>
                <ul className="mt-2 space-y-1 font-mono text-[11px]">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou ANON_KEY)</li>
                </ul>
              </div>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                Ajoutez ces variables dans votre fichier <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.local</code>,
                puis redémarrez le serveur de développement.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Service indisponible
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                L&apos;application ne parvient pas à se connecter à ses services. Réessayez dans quelques
                instants ; si le problème persiste, contactez votre administrateur ou le support.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
