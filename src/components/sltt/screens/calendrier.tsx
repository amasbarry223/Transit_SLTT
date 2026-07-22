"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  FileOutput,
  Wallet,
  X,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { usePermission } from "@/hooks/use-permission";
import { formatFCFA } from "@/lib/format";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { DossierStatutBadge, DOSSIER_STATUT_DOT } from "@/components/sltt/status-badge";
import { PageHeader } from "@/components/sltt/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type EventType = "dossier" | "bon" | "paiement";

interface CalEvent {
  id: string;
  type: EventType;
  label: string;
  sub: string;
  date: string;
  payload: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

const TYPE_PILL: Record<EventType, string> = {
  dossier:  "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400",
  bon:      "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400",
  paiement: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
};

const TYPE_ICON: Record<EventType, React.ComponentType<{ className?: string }>> = {
  dossier:  FolderKanban,
  bon:      FileOutput,
  paiement: Wallet,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const FR_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const FR_MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

// Monday-based week offset for a date
function weekOffset(d: Date) {
  return (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/* ------------------------------------------------------------------ */
/* Day panel                                                           */
/* ------------------------------------------------------------------ */

function DayPanel({
  date,
  events,
  onClose,
  onOpenDossier,
  onOpenBon,
}: {
  date: string;
  events: CalEvent[];
  onClose: () => void;
  onOpenDossier: (id: string) => void;
  onOpenBon: () => void;
}) {
  const d = new Date(date + "T12:00:00");
  const label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Card className="border-border/80 shadow-md">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{label}</p>
        <button
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <X className="size-4" />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Aucun événement ce jour.</div>
      ) : (
        <div className="divide-y divide-border">
          {events.map((ev) => {
            const Icon = TYPE_ICON[ev.type];
            return (
              <div
                key={ev.id}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-start gap-3 px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => {
                  if (ev.type === "dossier") onOpenDossier(ev.payload.id as string);
                  if (ev.type === "bon") onOpenBon();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (ev.type === "dossier") onOpenDossier(ev.payload.id as string);
                    if (ev.type === "bon") onOpenBon();
                  }
                }}
              >
                <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs", TYPE_PILL[ev.type])}>
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{ev.label}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{ev.sub}</p>
                </div>
                {ev.type === "dossier" && (
                  <DossierStatutBadge statut={ev.payload.statut as Parameters<typeof DossierStatutBadge>[0]["statut"]} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                         */
/* ------------------------------------------------------------------ */

export function CalendrierScreen() {
  const { openDossierDetail, go } = useNav();
  const canSeeDossiers = usePermission("dossiers:read");
  const canSeeBons = usePermission("bons:read");
  const canSeeComptabilite = usePermission("comptabilite:read");
  const dossiersRaw = useStore((s) => s.dossiers);
  const bonsRaw = useStore((s) => s.bons);
  const ecrituresRaw = useStore((s) => s.ecritures);
  // Le calendrier est accessible à tous les rôles (calendrier:read) mais chaque
  // type d'événement expose des données métier (client, montants) qui restent
  // soumises à la permission du module d'origine — pas de fuite entre modules.
  const dossiers = canSeeDossiers ? dossiersRaw : [];
  const bons = canSeeBons ? bonsRaw : [];
  const ecritures = canSeeComptabilite ? ecrituresRaw : [];

  // Ancrage sur aujourd'hui (cohérent avec le dashboard) — pas sur la donnée
  // la plus récente, sinon le bouton "Aujourd'hui" ne ramène pas au mois
  // courant si aucun dossier/bon/écriture n'a été créé récemment.
  const anchorDate = getDashboardAnchorDate();

  const [year, setYear] = React.useState(() => anchorDate.getFullYear());
  const [month, setMonth] = React.useState(() => anchorDate.getMonth());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  }
  function goToday() {
    setYear(anchorDate.getFullYear());
    setMonth(anchorDate.getMonth());
    setSelectedDate(null);
  }

  // Build events map { "2026-01-09": CalEvent[] }
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    function push(date: string, ev: CalEvent) {
      if (!map[date]) map[date] = [];
      map[date].push(ev);
    }

    for (const d of dossiers) {
      if (!d.date) continue;
      push(d.date, {
        id: `dos-${d.id}`,
        type: "dossier",
        label: d.reference,
        sub: `${d.clientNom} · ${d.nature || "—"}`,
        date: d.date,
        payload: { id: d.id, statut: d.statut },
      });
    }

    for (const b of bons) {
      if (!b.date) continue;
      push(b.date, {
        id: `bon-${b.id}`,
        type: "bon",
        label: b.reference,
        sub: `${b.clientNom} · ${b.marchandise} (${b.quantite} ${b.unite})`,
        date: b.date,
        payload: { id: b.id },
      });
    }

    for (const e of ecritures) {
      const d = e.datePaiement ?? e.date;
      if (!d) continue;
      push(d, {
        id: `pay-${e.id}`,
        type: "paiement",
        label: `Paiement · ${e.clientNom}`,
        sub: formatFCFA(e.montantPaye),
        date: d,
        payload: { id: e.id },
      });
    }

    return map;
  }, [dossiers, bons, ecritures]);

  // Build calendar grid
  const today = isoDate(new Date());
  const firstDay = startOfMonth(year, month);
  const offset = weekOffset(firstDay);  // columns before day 1
  const totalDays = daysInMonth(year, month);
  const totalCells = Math.ceil((offset + totalDays) / 7) * 7;

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - offset + 1;
    return day >= 1 && day <= totalDays ? day : null;
  });

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  // Count per type for the legend
  const monthEvents = React.useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => {
      const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      return eventsByDate[d] ?? [];
    }).flat();
    return {
      dossier: days.filter((e) => e.type === "dossier").length,
      bon: days.filter((e) => e.type === "bon").length,
      paiement: days.filter((e) => e.type === "paiement").length,
    };
  }, [eventsByDate, year, month, totalDays]);

  return (
    <div className="space-y-6">
      <PageHeader title="Calendrier" description="Vue mensuelle des dossiers, paiements et bons de sortie" />

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-9" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-[180px] text-center text-base font-semibold text-slate-900 dark:text-slate-100">
            {FR_MONTHS[month]} {year}
          </h2>
          <Button variant="outline" size="icon" className="size-9" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="ml-2 text-slate-500 dark:text-slate-400" onClick={goToday}>
            Aujourd&apos;hui
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="size-2 rounded-full bg-blue-500" />
            Dossiers ({monthEvents.dossier})
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="size-2 rounded-full bg-emerald-500" />
            Bons ({monthEvents.bon})
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="size-2 rounded-full bg-amber-500" />
            Paiements ({monthEvents.paiement})
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden border-border/80 shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-slate-50/70 dark:bg-slate-800/70">
          {FR_DAYS.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[96px] bg-slate-50/40 dark:bg-slate-800/40" />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const events = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            const dosDots = events.filter((e) => e.type === "dossier");
            const bonDots = events.filter((e) => e.type === "bon");
            const payDots = events.filter((e) => e.type === "paiement");

            return (
              <div
                key={dateStr}
                role="button"
                tabIndex={0}
                aria-label={`${day} — ${events.length} événement${events.length !== 1 ? "s" : ""}`}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDate(isSelected ? null : dateStr);
                  }
                }}
                className={cn(
                  "min-h-[96px] cursor-pointer p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                  isSelected
                    ? "bg-blue-50/80 dark:bg-blue-950/40"
                    : events.length > 0
                    ? "hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                    : "hover:bg-slate-50/40 dark:hover:bg-slate-800/40",
                )}
              >
                {/* Day number */}
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday
                        ? "bg-primary text-white"
                        : "text-slate-700 dark:text-slate-300",
                    )}
                  >
                    {day}
                  </span>
                  {events.length > 3 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">+{events.length - 3}</span>
                  )}
                </div>

                {/* Event pills */}
                <div className="space-y-0.5">
                  {dosDots.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40"
                    >
                      <span className={cn("size-1.5 shrink-0 rounded-full", DOSSIER_STATUT_DOT[ev.payload.statut as keyof typeof DOSSIER_STATUT_DOT] ?? "bg-blue-400")} />
                      <span className="truncate text-[10px] font-medium text-blue-700 dark:text-blue-400">{ev.label}</span>
                    </div>
                  ))}
                  {bonDots.slice(0, 1).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40">
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="truncate text-[10px] font-medium text-emerald-700 dark:text-emerald-400">{ev.label}</span>
                    </div>
                  ))}
                  {payDots.slice(0, 1).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40">
                      <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span className="truncate text-[10px] font-medium text-amber-700 dark:text-amber-400">{ev.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day detail panel */}
      {selectedDate && (
        <DayPanel
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
          onOpenDossier={(id) => openDossierDetail(id)}
          onOpenBon={() => go("bons")}
        />
      )}
    </div>
  );
}
