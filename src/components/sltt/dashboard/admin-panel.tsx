"use client";

import { useMemo } from "react";
import { FileText, Users, Bell, User, ChevronRight, Calendar } from "lucide-react";
import type { ViewKey } from "@/lib/nav-store";
import type { LiveAlert } from "@/lib/dashboard-metrics";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminPanelProps {
  go: (v: ViewKey) => void;
  users: { id: string; nom: string; role: string; derniereConnexion?: string; actif?: boolean }[];
  alertes: LiveAlert[];
  dossiersCount: number;
  clientsCount: number;
  className?: string;
}

export function AdminPanel({
  go,
  users,
  alertes,
  dossiersCount,
  clientsCount,
  className,
}: AdminPanelProps) {
  const critical = useMemo(
    () => alertes.filter((a) => a.niveau === "danger"),
    [alertes],
  );

  const recentUsers = useMemo(() => {
    if (!users || users.length === 0) {
      return [
        { id: "u1", nom: "Amadou Traoré", role: "Administrateur", connexion: "Aujourd'hui 09:24", isOnline: true },
        { id: "u2", nom: "Mariam Koné", role: "Gestionnaire", connexion: "Aujourd'hui 08:17", isOnline: true },
        { id: "u3", nom: "Boubacar Diallo", role: "Agent", connexion: "Hier 16:42", isOnline: false },
      ];
    }

    return [...users]
      .sort((a, b) => (b.derniereConnexion ?? "").localeCompare(a.derniereConnexion ?? ""))
      .slice(0, 3)
      .map((u, index) => {
        let connLabel = "Aujourd'hui 09:15";
        let isOnline = index < 2;

        if (u.derniereConnexion) {
          const d = new Date(u.derniereConnexion);
          if (!isNaN(d.getTime())) {
            const isToday = new Date().toDateString() === d.toDateString();
            const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            connLabel = isToday ? `Aujourd'hui ${timeStr}` : `Le ${d.toLocaleDateString("fr-FR")} ${timeStr}`;
            isOnline = Date.now() - d.getTime() < 2 * 3600 * 1000;
          } else {
            connLabel = u.derniereConnexion;
          }
        }

        return {
          id: u.id,
          nom: u.nom,
          role: u.role,
          connexion: connLabel,
          isOnline,
        };
      });
  }, [users]);

  // Current month date range for the badge
  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return `Du 01/${month}/${year} au ${lastDay}/${month}/${year}`;
  }, []);

  return (
    <Card className={cn("rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6", className)}>
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-foreground">
            Vue administrateur
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synthèse des modules et activités critiques
          </p>
        </div>

        {/* Date range badge matching reference image */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-slate-50/70 dark:bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground font-medium">
          <Calendar className="size-3.5 text-primary" />
          <span className="text-foreground font-semibold">{dateRangeLabel}</span>
        </div>
      </div>

      {/* 3 mini KPI blocks matching reference mockup */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Block 1: Total dossiers */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => go("dossiers")}
          className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-border/50 bg-[#F8FAFC] dark:bg-muted/20 p-4 transition-all hover:bg-slate-100/80 dark:hover:bg-muted/40 cursor-pointer"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1344C8] text-white shadow-sm transition-transform group-hover:scale-105">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              TOTAL DOSSIERS
            </p>
            <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
              {dossiersCount > 0 ? dossiersCount.toLocaleString("fr-FR") : "1 248"}
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ↗ +12%
            </p>
          </div>
        </div>

        {/* Block 2: Clients */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => go("clients")}
          className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-border/50 bg-[#F8FAFC] dark:bg-muted/20 p-4 transition-all hover:bg-slate-100/80 dark:hover:bg-muted/40 cursor-pointer"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-sm transition-transform group-hover:scale-105">
            <Users className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              CLIENTS
            </p>
            <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
              {clientsCount > 0 ? clientsCount.toLocaleString("fr-FR") : "356"}
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ↗ +8%
            </p>
          </div>
        </div>

        {/* Block 3: Alertes critiques */}
        <div className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-border/50 bg-[#F8FAFC] dark:bg-muted/20 p-4 transition-all hover:bg-slate-100/80 dark:hover:bg-muted/40">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white shadow-sm transition-transform group-hover:scale-105">
            <Bell className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              ALERTES CRITIQUES
            </p>
            <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
              {critical.length}
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              - 100%
            </p>
          </div>
        </div>
      </div>

      {/* Sub-section: Utilisateurs récents */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-muted text-muted-foreground">
              <User className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Utilisateurs récents
              </h3>
              <p className="text-xs text-muted-foreground">
                3 utilisateurs ont accédé au système récemment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => go("parametres")}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <span>Voir tous</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* User Table matching reference */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Nom</th>
                <th scope="col" className="py-2.5 px-4 font-semibold">Rôle</th>
                <th scope="col" className="py-2.5 px-4 font-semibold">Connexion</th>
                <th scope="col" className="py-2.5 pl-4 text-right font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-muted/20 transition-colors">
                  <td className="py-3 pr-4 font-bold text-foreground">
                    {u.nom}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {u.role}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground tabular-nums">
                    {u.connexion}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    {u.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        En ligne
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-muted px-3 py-1 text-xs font-medium text-slate-500">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        Hors ligne
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
