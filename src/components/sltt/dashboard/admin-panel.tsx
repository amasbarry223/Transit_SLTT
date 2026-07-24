"use client";

import { FolderKanban, Users } from "lucide-react";
import type { ViewKey } from "@/lib/nav-store";
import type { LiveAlert } from "@/lib/dashboard-metrics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminPanel({
  go,
  users,
  alertes,
  openDossierDetail,
  dossiersCount,
  clientsCount,
}: {
  go: (v: ViewKey) => void;
  users: { id: string; nom: string; role: string; derniereConnexion?: string }[];
  alertes: LiveAlert[];
  openDossierDetail: (id: string) => void;
  dossiersCount: number;
  clientsCount: number;
}) {
  const critical = alertes.filter((a) => a.niveau === "danger").slice(0, 4);
  const recentUsers = [...users]
    .sort((a, b) => (b.derniereConnexion ?? "").localeCompare(a.derniereConnexion ?? ""))
    .slice(0, 4);

  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Vue administrateur
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synthèse cross-modules et alertes critiques
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => go("parametres")}>
            <Users className="size-3.5" />
            Utilisateurs
          </Button>
          <Button variant="outline" size="sm" onClick={() => go("dossiers")}>
            <FolderKanban className="size-3.5" />
            Tous les dossiers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-slate-50/80 p-4 dark:bg-slate-900/50">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dossiers actifs</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{dossiersCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-slate-50/80 p-4 dark:bg-slate-900/50">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clients</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{clientsCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-slate-50/80 p-4 dark:bg-slate-900/50">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Alertes critiques</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">{critical.length}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Alertes prioritaires</p>
          {critical.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune alerte critique.</p>
          ) : (
            <ul className="space-y-2">
              {critical.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-red-200/80 bg-red-50/50 px-3 py-2 text-left text-sm hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
                    onClick={() => {
                      if (a.target.view === "dossier-detail" && a.target.id) {
                        openDossierDetail(a.target.id);
                      } else {
                        go(a.target.view);
                      }
                    }}
                  >
                    <span className="font-medium text-red-800 dark:text-red-300">{a.message}</span>
                    <span className="mt-0.5 block text-xs text-red-700/80 dark:text-red-400/80">{a.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Utilisateurs récents</p>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun utilisateur enregistré.</p>
          ) : (
            <ul className="space-y-2">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{u.nom}</span>
                  <span className="text-xs text-slate-500">{u.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
