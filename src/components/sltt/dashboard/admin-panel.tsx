"use client";

import { AlertTriangle, FolderKanban, Users } from "lucide-react";
import type { ViewKey } from "@/lib/nav-store";
import type { LiveAlert } from "@/lib/dashboard-metrics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials, USER_AVATAR_GRADIENT } from "@/lib/utils";

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
    <Card className="rounded-xl border-border/80 p-5 shadow-sm">
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
        {[
          { label: "Dossiers actifs", value: dossiersCount },
          { label: "Clients", value: clientsCount },
          { label: "Alertes critiques", value: critical.length, danger: true },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-bold tabular-nums",
                item.danger ? "text-[var(--brand-secondary)]" : "text-slate-900 dark:text-slate-100",
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Alertes prioritaires
          </p>
          {critical.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune alerte critique.</p>
          ) : (
            <ul className="space-y-2">
              {critical.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2.5 rounded-lg border border-[var(--brand-secondary-light)] bg-[var(--brand-secondary-light)]/60 px-3 py-2.5 text-left text-sm hover:bg-[var(--brand-secondary-light)] dark:border-red-900/50 dark:bg-red-950/30"
                    onClick={() => {
                      if (a.target.view === "dossier-detail" && a.target.id) {
                        openDossierDetail(a.target.id);
                      } else {
                        go(a.target.view);
                      }
                    }}
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--brand-secondary)]" />
                    <span>
                      <span className="font-medium text-[var(--brand-secondary-hover)] dark:text-red-300">{a.message}</span>
                      <span className="mt-0.5 block text-xs text-[var(--brand-secondary)]/80 dark:text-red-400/80">{a.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Utilisateurs récents
          </p>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun utilisateur enregistré.</p>
          ) : (
            <ul className="space-y-2">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className={cn("text-xs font-semibold text-white", USER_AVATAR_GRADIENT)}>
                      {getInitials(u.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900 dark:text-slate-100">{u.nom}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{u.role}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
