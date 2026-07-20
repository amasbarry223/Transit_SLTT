"use client";

import * as React from "react";
// PERF-04: Recharts is "use client" only — next/dynamic per-component doesn't compose well with
// Recharts' internal defaultProps. Instead we use a lazy-loaded wrapper so the bundle is
// split at the chart level (see DashboardCharts component at bottom of file).
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Wallet,
  Clock,
  FolderKanban,
  Warehouse,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Package,
  ClipboardList,
  CheckCircle2,
  PieChart as PieChartIcon,
  Plus,
  FileOutput,
  Users,
  Compass,
  X,
  Check,
  TrendingUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { KpiCard } from "@/components/sltt/kpi-card";
import { PageHeader } from "@/components/sltt/page-header";
import { DossierStatutBadge, DOSSIER_STATUT_DOT, DOSSIER_STATUT_HEX } from "@/components/sltt/status-badge";

import { useNav, type ViewKey } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA, formatFCFACompact, parseLocalDate } from "@/lib/format";
import { resteAPayer } from "@/lib/domain-types";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { getDashboardSections, kpiGridClass, type DashboardSection } from "@/lib/dashboard-config";
import { filterBySocieteAndPeriode, computeBenefice } from "@/lib/benefice";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import {
  GUIDE_DISMISS_KEY,
  GUIDE_RESET_EVENT,
  getGuideProgress,
  emitGuideReset,
  type GuideStepView,
} from "@/lib/guide-progress";
import { useCurrentUser } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* CHART COLORS                                                        */
/* ------------------------------------------------------------------ */

const SLTT_BLUE = "#1E40AF";
const SLTT_EMERALD = "#059669";
const SLTT_RED = "#DC2626";
const SLTT_GRID = "#E2E8F0";

/* ------------------------------------------------------------------ */
/* CUSTOM TOOLTIPS                                                     */
/* ------------------------------------------------------------------ */

type ChartTooltipPayload = {
  name?: string | number;
  value?: number;
  payload?: Record<string, unknown>;
};

function EncaissementsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const valeur = item?.value ?? 0;
  const mois = (item?.payload as { mois?: string })?.mois ?? "";
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-slate-800 p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900 dark:text-slate-100">{mois}</p>
      <p className="mt-0.5 tabular-nums text-slate-600 dark:text-slate-300">{formatFCFA(valeur)}</p>
    </div>
  );
}

function EcartsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const ecart = item?.value ?? 0;
  const isPositive = ecart >= 0;
  const periode = (item?.payload as { periode?: string })?.periode ?? "";
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-slate-800 p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900 dark:text-slate-100">{periode}</p>
      <p className={"mt-0.5 tabular-nums font-medium " + (isPositive ? "text-emerald-600" : "text-red-600")}>
        {isPositive ? "+" : ""}{formatFCFA(ecart)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ROLE-SPECIFIC PANELS                                                */
/* ------------------------------------------------------------------ */

function AgentPanel({
  go,
  openDossier,
}: {
  go: (v: "dossiers" | "devis", opts?: { id?: string | null }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
}) {
  const dossiers = useStore((s) => s.dossiers);
  const pipeline: Record<string, number> = { "En cours": 0, "Dédouané": 0, "Livré": 0, "Soldé": 0 };
  for (const d of dossiers) pipeline[d.statut] = (pipeline[d.statut] ?? 0) + 1;

  const steps = [
    { label: "En cours",  count: pipeline["En cours"],  color: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-700 dark:text-blue-400"  },
    { label: "Dédouané",  count: pipeline["Dédouané"],  color: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/40",  text: "text-indigo-700 dark:text-indigo-400"},
    { label: "Livré",     count: pipeline["Livré"],     color: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-400" },
    { label: "Soldé",     count: pipeline["Soldé"],     color: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400"},
  ];

  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pipeline dossiers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">État de votre portefeuille</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => go("dossiers")}>
            Voir tout <ArrowRight className="ml-1 size-3.5" />
          </Button>
          <Button size="sm" onClick={() => openDossier(null, "create")}>
            <Plus className="mr-1 size-3.5" /> Nouveau dossier
          </Button>
        </div>
      </div>
      {dossiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
          <FolderKanban className="size-7 text-slate-200 dark:text-slate-700" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun dossier pour l'instant.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Créez un devis ou un dossier pour démarrer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((s) => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.bg}`}>
              <p className={`text-2xl font-bold tabular-nums ${s.text}`}>{s.count}</p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{s.label}</p>
              <div className={`mx-auto mt-2 h-1 w-8 rounded-full ${s.color}`} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MagasinierPanel({ go }: { go: (v: "entreposage" | "bons", opts?: { id?: string | null }) => void }) {
  const stock = useStore((s) => s.stock);
  const bons = useStore((s) => s.bons);
  const lowStock = stock.filter((s) => s.quantite <= s.seuil);
  const bonsBrouillon = bons.filter((b) => b.statut === "Brouillon");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">État du stock</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stock.length} articles gérés</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => go("entreposage")}>
            Stock <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        {stock.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
            <Warehouse className="size-7 text-slate-200 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun article en stock.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Ajoutez votre premier article depuis l'Entreposage.</p>
          </div>
        ) : stock.slice(0, 4).map((s) => {
          const pct = Math.min(100, Math.round((s.quantite / Math.max(1, s.seuil * 2)) * 100));
          const low = s.quantite <= s.seuil;
          return (
            <div key={s.id} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[60%]">{s.marchandise}</span>
                <span className={`tabular-nums font-semibold ${low ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}`}>
                  {s.quantite} {s.unite}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-1.5 rounded-full transition-[width] ${low ? "bg-red-400" : "bg-emerald-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {lowStock.length > 0 && (
          <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">⚠ {lowStock.length} article{lowStock.length > 1 ? "s" : ""} sous le seuil</p>
        )}
      </Card>

      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bons en attente</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{bonsBrouillon.length} brouillon{bonsBrouillon.length !== 1 ? "s" : ""} à valider</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => go("bons")}>
              Bons <ArrowRight className="ml-1 size-3.5" />
            </Button>
            <Button size="sm" onClick={() => go("bons", { id: "new" })}>
              <Plus className="mr-1 size-3.5" /> Nouveau bon
            </Button>
          </div>
        </div>
        {bonsBrouillon.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-8 text-emerald-300" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucun bon en attente</p>
          </div>
        ) : (
          bonsBrouillon.slice(0, 4).map((b) => (
            <div key={b.id} className="mb-3 flex items-center gap-3 last:mb-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                <Package className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{b.reference}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{b.marchandise} · {b.quantite} {b.unite}</p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function ComptablePanel({ go }: { go: (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void }) {
  const ecritures = useStore((s) => s.ecritures);
  const factures = useStore((s) => s.factures);
  const dossiers = useStore((s) => s.dossiers);
  const totalDu = dossiers.reduce((s, d) => s + resteAPayer(d), 0);
  const nbImpayés = dossiers.filter((d) => resteAPayer(d) > 0).length;
  const dernières = [...ecritures]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 5);

  const facturesImpayées = factures.filter((f) => f.statut !== "Soldée" && f.statut !== "Annulée");
  const totalFactures = facturesImpayées.reduce(
    (s, f) => s + resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Créances en cours</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{nbImpayés} dossier{nbImpayés !== 1 ? "s" : ""} non soldé{nbImpayés !== 1 ? "s" : ""} · {formatFCFA(totalDu)} restants</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => go("comptabilite")}>
            Comptabilité <ArrowRight className="ml-1 size-3.5" />
          </Button>
          <Button size="sm" onClick={() => go("comptabilite", { id: "new" })}>
            <Plus className="mr-1 size-3.5" /> Nouvelle écriture
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {dernières.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Aucune écriture enregistrée.</p>
        ) : dernières.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <div className={`size-2 shrink-0 rounded-full ${e.montantPaye >= e.montantInvesti ? "bg-emerald-500" : "bg-amber-400"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{e.clientNom}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{e.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatFCFA(e.montantPaye)}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">/ {formatFCFA(e.montantInvesti)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>

    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Factures en attente</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{facturesImpayées.length} facture{facturesImpayées.length !== 1 ? "s" : ""} · {formatFCFA(totalFactures)} restants</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => go("factures")}>
          Factures <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        {facturesImpayées.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-7 text-emerald-300" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucune facture en attente</p>
          </div>
        ) : facturesImpayées.slice(0, 5).map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FileOutput className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{f.numero} · {f.clientNom}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{f.statut}</p>
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {formatFCFA(resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }))}
            </span>
          </div>
        ))}
      </div>
    </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ALERT TYPE (computed live from store)                               */
/* ------------------------------------------------------------------ */

interface LiveAlert {
  id: string;
  niveau: "danger" | "warning";
  message: string;
  detail: string;
  /** Où l'alerte doit naviguer au clic — toujours le sujet réel de l'alerte. */
  target: { view: "entreposage" | "dossier-detail"; id?: string };
}

/* ------------------------------------------------------------------ */
/* GUIDE DE DÉMARRAGE (progression dynamique)                          */
/* ------------------------------------------------------------------ */

function GuideDemarrage({
  role,
  go,
}: {
  role: string;
  go: (view: GuideStepView) => void;
}) {
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const ecritures = useStore((s) => s.ecritures);
  const stock = useStore((s) => s.stock);
  const bons = useStore((s) => s.bons);

  const guideData = React.useMemo(
    () => ({
      clientsCount: clients.length,
      dossiersCount: dossiers.length,
      ecrituresCount: ecritures.length,
      dossiersSoldesCount: dossiers.filter((d) => d.statut === "Soldé").length,
      stockCount: stock.length,
      bonsCount: bons.length,
    }),
    [clients.length, dossiers, ecritures.length, stock.length, bons.length],
  );

  const progress = React.useMemo(
    () => getGuideProgress(role as import("@/lib/domain-types").UserRole, guideData),
    [role, guideData],
  );

  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(GUIDE_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [forceShow, setForceShow] = React.useState(false);

  React.useEffect(() => {
    const handler = () => {
      setDismissed(false);
      setForceShow(true);
    };
    window.addEventListener(GUIDE_RESET_EVENT, handler);
    return () => window.removeEventListener(GUIDE_RESET_EVENT, handler);
  }, []);

  React.useEffect(() => {
    if (progress.allComplete && !dismissed) {
      try {
        localStorage.setItem(GUIDE_DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [progress.allComplete, dismissed]);

  if (progress.total === 0) return null;
  if ((dismissed && !forceShow) || progress.allComplete) return null;

  function isStepDone(stepId: string): boolean {
    switch (stepId) {
      case "clients":
        return guideData.clientsCount > 0;
      case "dossiers":
        return guideData.dossiersCount > 0;
      case "paiements":
        return guideData.ecrituresCount > 0;
      case "bilans":
        return guideData.dossiersSoldesCount > 0;
      case "stock":
        return guideData.stockCount > 0;
      case "bons":
        return guideData.bonsCount > 0;
      default:
        return false;
    }
  }

  const firstPending = progress.steps.find((s) => !isStepDone(s.id));

  function dismiss() {
    setDismissed(true);
    setForceShow(false);
    try {
      localStorage.setItem(GUIDE_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="gap-0 border-blue-200/70 bg-blue-50/40 p-0 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20">
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Par où commencer ?
          </h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {progress.completed}/{progress.total}
          </span>
        </div>
        <button
          onClick={dismiss}
          aria-label="Masquer le guide de démarrage"
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-100/60 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-blue-900/40 dark:hover:text-slate-200"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mx-4 mb-2 mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/50">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] dark:bg-blue-500"
          style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {progress.steps.map((s, i) => {
          const done = isStepDone(s.id);
          const isNext = firstPending?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => go(s.view)}
              className={cn(
                "group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                done
                  ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                  : isNext
                    ? "border-blue-300 bg-white dark:border-blue-700 dark:bg-slate-900"
                    : "border-border/60 bg-white dark:bg-slate-900",
                !done && "hover:border-blue-300 dark:hover:border-blue-700",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {s.label}
                </span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {done ? "Terminé" : s.sub}
                </span>
              </span>
              {!done && (
                <ArrowRight className="size-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500 dark:text-slate-600" />
              )}
            </button>
          );
        })}
      </div>
      {firstPending && progress.completed < progress.total && (
        <div className="border-t border-blue-200/50 px-5 py-3 dark:border-blue-900/40">
          <Button size="sm" variant="outline" className="h-8" onClick={() => go(firstPending.view)}>
            Continuer : {firstPending.label}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}

function AdminPanel({
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

/* ------------------------------------------------------------------ */
/* SCREEN                                                              */
/* ------------------------------------------------------------------ */

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const openDossier = useNav((s) => s.openDossier);
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);
  const theme = useNav((s) => s.theme);
  // Recharts dessine en SVG avec des couleurs passées en props — les classes
  // `dark:` de Tailwind n'ont aucune prise dessus, il faut donc calculer les
  // couleurs de grille/axes/curseur en JS selon le thème actif.
  const isDark = theme === "dark";
  const gridColor = isDark ? "#1E293B" : SLTT_GRID;
  const tickColor = isDark ? "#94A3B8" : "#64748B";
  const barCursorFill = isDark ? "#1E293B" : "#EFF6FF";
  const lineCursorStroke = isDark ? "#334155" : "#CBD5E1";
  const dossiers = useStore((s) => s.dossiers);
  const ecritures = useStore((s) => s.ecritures);
  const factures = useStore((s) => s.factures);
  const stock = useStore((s) => s.stock);
  const users = useStore((s) => s.usersPublic);
  const clients = useStore((s) => s.clients);
  const depenses = useStore((s) => s.depenses);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);
  const lastSyncedAt = useStore((s) => s.lastSyncedAt);
  const currentUser = useCurrentUser();
  const selectedSocieteId = useNav((s) => s.selectedSocieteId);

  const sections = React.useMemo(
    () => getDashboardSections(currentUser),
    [currentUser],
  );
  const hasSection = (section: DashboardSection) => sections.has(section);

  const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  // Ancrage calendaire : date du jour (pas la date max des données)
  const anchorDate = getDashboardAnchorDate();

  const periodeLabel = anchorDate
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  const syncLabel = React.useMemo(() => {
    if (!lastSyncedAt) return null;
    const mins = Math.floor((Date.now() - lastSyncedAt) / 60000);
    if (mins < 1) return "Sync · à l'instant";
    if (mins < 60) return `Sync · il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    return `Sync · il y a ${hours}h`;
  }, [lastSyncedAt]);

  // Une écriture compte au mois où l'argent est réellement arrivé
  // (datePaiement), pas au mois de création de l'écriture — utilisé pour
  // tous les calculs "encaissé" ci-dessous (KPI, graphique, bénéfice) afin
  // qu'ils s'accordent tous sur la même règle.
  const ecrituresAvecDate = React.useMemo(
    () => ecritures.map((e) => ({ ...e, date: e.datePaiement ?? e.date })),
    [ecritures],
  );
  const depensesAvecDate = React.useMemo(
    () => depenses.map((d) => ({ ...d, date: d.dateDepense })),
    [depenses],
  );
  // Sorties de caisse : chaque bon porte désormais sa propre société (F1).
  const caisseAvecDate = React.useMemo(
    () =>
      bonsSortieCaisse.flatMap((b) =>
        b.lignes.map((l) => ({ societeId: b.societeId as string | undefined, date: l.date, montant: l.montant })),
      ),
    [bonsSortieCaisse],
  );

  // ---- Live KPI computations ----
  // LOGIC-03 (audit) : Écritures et Factures sont deux canaux de paiement
  // indépendants — payer une facture ne touche jamais une écriture, et
  // inversement. Ils sont donc additionnés (pas dédoublonnés) pour donner
  // un seul chiffre "encaissé" fiable au lieu de deux chiffres partiels.
  // Filtrage via filterBySocieteAndPeriode (societeId=null → pas de scope
  // société) pour un parsing de date sûr (ancré à midi, pas minuit UTC —
  // évite un décalage d'un jour selon le fuseau du navigateur).
  const { chiffreEncaisse, variationEncaisse } = React.useMemo(() => {
    const curM = anchorDate.getMonth();
    const curY = anchorDate.getFullYear();
    const prevM = curM === 0 ? 11 : curM - 1;
    const prevY = curM === 0 ? curY - 1 : curY;

    const encaisseSur = (year: number, month: number) => {
      const fromEcritures = filterBySocieteAndPeriode(ecrituresAvecDate, null, year, month)
        .reduce((sum, e) => sum + e.montantPaye, 0);
      // Les factures n'ont pas de date de paiement dédiée : la date de la
      // facture est le meilleur proxy disponible.
      const fromFactures = filterBySocieteAndPeriode(factures, null, year, month)
        .reduce((sum, f) => sum + f.montantPaye, 0);
      return fromEcritures + fromFactures;
    };

    const current = encaisseSur(curY, curM);
    const prev = encaisseSur(prevY, prevM);

    const variation = prev === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - prev) / prev) * 100);
    return { chiffreEncaisse: current, variationEncaisse: variation };
  }, [ecrituresAvecDate, factures, anchorDate]);
  const beneficeMoisCourant = React.useMemo(() => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const recettes =
      filterBySocieteAndPeriode(ecrituresAvecDate, selectedSocieteId, year, month).reduce((s, e) => s + e.montantPaye, 0) +
      filterBySocieteAndPeriode(factures, selectedSocieteId, year, month).reduce((s, f) => s + f.montantPaye, 0);
    const depensesMois =
      filterBySocieteAndPeriode(depensesAvecDate, selectedSocieteId, year, month).reduce((s, d) => s + d.montant, 0) +
      filterBySocieteAndPeriode(caisseAvecDate, selectedSocieteId, year, month).reduce((s, d) => s + d.montant, 0);
    return computeBenefice(recettes, depensesMois);
  }, [ecrituresAvecDate, factures, depensesAvecDate, caisseAvecDate, selectedSocieteId, anchorDate]);

  // Restes à payer et dossiers non soldés → source : dossiers (pas les écritures)
  const { totalRestesAPayer, nbDossiersNonSoldes } = React.useMemo(() => {
    let total = 0;
    let count = 0;
    for (const d of dossiers) {
      const reste = resteAPayer(d);
      if (reste > 0) {
        total += reste;
        count += 1;
      }
    }
    return { totalRestesAPayer: total, nbDossiersNonSoldes: count };
  }, [dossiers]);

  const dossiersEnCours = React.useMemo(
    () => dossiers.filter((d) => d.statut === "En cours").length,
    [dossiers],
  );

  // Dossiers dédouanés en attente de livraison (sublabel du KPI "En cours")
  const dossiersALivrer = React.useMemo(
    () => dossiers.filter((d) => d.statut === "Dédouané").length,
    [dossiers],
  );

  const valeurStock = React.useMemo(
    () => stock.reduce((sum, s) => sum + s.sommePayee + s.resteAPayer, 0),
    [stock],
  );

  // ---- Chart: encaissements des 6 derniers mois (source : ecritures) ----
  // Utilise ecrituresAvecDate (date de paiement réelle) + filterBySocieteAndPeriode
  // (parsing sûr) — même règle que le KPI "Encaissé ce mois" ci-dessus, pour que
  // le chiffre du mois courant sur le graphique et sur le KPI concordent toujours.
  const encaissementsParMois = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const valeur = filterBySocieteAndPeriode(ecrituresAvecDate, null, y, m)
        .reduce((sum, e) => sum + e.montantPaye, 0);
      return { mois: MONTHS[m], valeur };
    });
  }, [ecrituresAvecDate, anchorDate]);

  // ---- Chart: marge brute des 6 derniers mois (source : dossiers) ----
  const ecartsParPeriode = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const ecart = filterBySocieteAndPeriode(dossiers, null, y, m)
        .reduce((sum, dos) => sum + (dos.fraisPrestation - dos.droitDouane - dos.fraisCircuit), 0);
      return { periode: MONTHS[m], ecart };
    });
  }, [dossiers, anchorDate]);

  // ---- Derniers dossiers (sorted by date desc, first 6) ----
  const derniersDossiers = React.useMemo(
    () =>
      [...dossiers]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, 6),
    [dossiers],
  );

  // ---- Chart: répartition dossiers par statut (donut) ----
  // Uses DOSSIER_STATUT_HEX (status-badge.tsx) so the donut always agrees with
  // the DossierStatutBadge shown everywhere else — see LOGIC-04 in the audit.
  const statutDonutData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of dossiers) {
      counts[d.statut] = (counts[d.statut] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: DOSSIER_STATUT_HEX[name as keyof typeof DOSSIER_STATUT_HEX] ?? "#94A3B8",
    }));
  }, [dossiers]);

  const totalDossiers = dossiers.length;

  // ---- Live alerts (low stock + unpaid dossiers + échéances) ----
  const alertes = React.useMemo<LiveAlert[]>(() => {
    const todayMs = new Date().setHours(0, 0, 0, 0);

    const lowStockAlerts: LiveAlert[] = stock
      .filter((s) => s.quantite < s.seuil)
      .map((s) => ({
        id: `stock-${s.id}`,
        niveau: "danger" as const,
        message: `Stock faible : ${s.marchandise}`,
        detail: `${s.quantite} ${s.unite} restants — ${s.depositaire}`,
        target: { view: "entreposage" as const },
      }));

    const echeanceAlerts: LiveAlert[] = dossiers
      .filter((d) => d.dateEcheance && !["Livré", "Soldé"].includes(d.statut))
      .reduce<LiveAlert[]>((acc, d) => {
        const echeance = parseLocalDate(d.dateEcheance!).setHours(0, 0, 0, 0);
        const jours = Math.ceil((echeance - todayMs) / 86400000);
        if (jours < 0) {
          acc.push({
            id: `echeance-${d.id}`,
            niveau: "danger",
            message: `Échéance dépassée : ${d.reference.replace("SLTT-TR-", "")}`,
            detail: `Dépassée de ${Math.abs(jours)}j — ${d.clientNom}`,
            target: { view: "dossier-detail", id: d.id },
          });
        } else if (jours <= 3) {
          acc.push({
            id: `echeance-${d.id}`,
            niveau: "warning",
            message: `Échéance dans ${jours}j : ${d.reference.replace("SLTT-TR-", "")}`,
            detail: `${d.clientNom} — ${d.nature}`,
            target: { view: "dossier-detail", id: d.id },
          });
        }
        return acc;
      }, []);

    const unpaid: LiveAlert[] = dossiers
      .filter((d) => resteAPayer(d) > 0)
      .slice(0, 4)
      .map((d) => ({
        id: `dossier-${d.id}`,
        niveau: "warning" as const,
        message: `Dossier non soldé : ${d.reference}`,
        detail: `Reste à payer : ${formatFCFA(resteAPayer(d))} — ${d.clientNom}`,
        target: { view: "dossier-detail" as const, id: d.id },
      }));

    return [...lowStockAlerts, ...echeanceAlerts, ...unpaid];
  }, [stock, dossiers]);

  const filteredAlertes = React.useMemo(() => {
    const items: LiveAlert[] = [];
    if (hasSection("alertes_stock")) {
      items.push(...alertes.filter((a) => a.id.startsWith("stock-")));
    }
    if (hasSection("alertes_dossiers")) {
      items.push(...alertes.filter((a) => !a.id.startsWith("stock-")));
    }
    return items;
  }, [alertes, sections]);

  const visibleKpiCount = [
    hasSection("kpi_encaisse"),
    hasSection("kpi_restes"),
    hasSection("kpi_dossiers"),
    hasSection("kpi_stock"),
    hasSection("kpi_benefice"),
  ].filter(Boolean).length;

  const showChartsRow =
    hasSection("chart_encaissements") || hasSection("chart_marges");
  const showBlocksRow =
    hasSection("derniers_dossiers") ||
    hasSection("chart_statuts") ||
    hasSection("alertes_stock") ||
    hasSection("alertes_dossiers");

  const firstName = currentUserName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Tableau de bord"
        description={`Bonjour ${firstName} — Vue d'ensemble de votre activité ce mois-ci`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm shadow-sm">
            <span className="text-slate-500 dark:text-slate-400">Période :</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{periodeLabel}</span>
          </div>
          {syncLabel && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-500 shadow-sm dark:text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {syncLabel}
            </div>
          )}
          {hasSection("kpi_benefice") && <SocieteFilterSelect className="w-full sm:w-44" />}
        </div>
      </PageHeader>

      {/* 1b. GUIDE DE DÉMARRAGE — les 4 gestes du cahier des charges */}
      <GuideDemarrage role={currentRole} go={(v) => go(v)} />

      {/* 2. KPI ROW */}
      {visibleKpiCount > 0 && (
      <div className={cn("grid w-full gap-3 sm:gap-4", kpiGridClass(visibleKpiCount))}>
        {hasSection("kpi_encaisse") && (
        <KpiCard
          label="Encaissé ce mois"
          value={formatFCFA(chiffreEncaisse)}
          icon={Wallet}
          tone="emerald"
          variation={variationEncaisse}
          variationLabel="vs mois dernier"
          tooltip="Somme des encaissements du mois : paiements enregistrés via les écritures comptables et les factures. Les paiements dossier passent par les écritures liées ; les deux canaux sont additionnés, pas dédoublonnés."
        />
        )}
        {hasSection("kpi_restes") && (
        <KpiCard
          label="Restes à payer"
          value={formatFCFA(totalRestesAPayer)}
          icon={Clock}
          tone="amber"
          sublabel={`Sur ${nbDossiersNonSoldes} dossier${nbDossiersNonSoldes > 1 ? "s" : ""}`}
        />
        )}
        {hasSection("kpi_dossiers") && (
        <KpiCard
          label="Dossiers en cours"
          value={String(dossiersEnCours)}
          icon={FolderKanban}
          tone="blue"
          sublabel={dossiersALivrer > 0 ? `${dossiersALivrer} dédouané${dossiersALivrer > 1 ? "s" : ""} à livrer` : "Aucun en attente de livraison"}
        />
        )}
        {hasSection("kpi_stock") && (
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Warehouse}
          tone="indigo"
          sublabel={`${stock.length} article${stock.length > 1 ? "s" : ""}`}
        />
        )}
        {hasSection("kpi_benefice") && (
        <KpiCard
          label="Bénéfice ce mois"
          value={formatFCFA(beneficeMoisCourant)}
          icon={TrendingUp}
          tone={beneficeMoisCourant >= 0 ? "emerald" : "red"}
          sublabel="Recettes − Dépenses"
          tooltip="Recettes = écritures + paiements factures filtrés par société. Dépenses = dépenses de contrats filtrées par société. Voir Comptabilité pour le détail par société."
        />
        )}
      </div>
      )}

      {/* 2b. ROLE PANEL */}
      {currentRole === "Administrateur" && (
        <AdminPanel
          go={go}
          users={users}
          alertes={alertes}
          openDossierDetail={openDossierDetail}
          dossiersCount={dossiers.length}
          clientsCount={clients.length}
        />
      )}
      {currentRole === "Agent de transit" && (
        <AgentPanel
          go={go as (v: "dossiers" | "devis", opts?: { id?: string | null }) => void}
          openDossier={openDossier}
        />
      )}
      {currentRole === "Magasinier" && (
        <MagasinierPanel go={go as (v: "entreposage" | "bons", opts?: { id?: string | null }) => void} />
      )}
      {currentRole === "Comptable" && (
        <ComptablePanel go={go as (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void} />
      )}

      {/* 3. CHARTS ROW */}
      {showChartsRow && (
      <div className={cn("grid grid-cols-1 gap-6", hasSection("chart_encaissements") && hasSection("chart_marges") && "lg:grid-cols-2")}>
        {hasSection("chart_encaissements") && (
        <Card className="p-5 shadow-sm border-border/80 rounded-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Encaissements par mois
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">6 derniers mois</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-block size-2.5 rounded-sm bg-[#1E40AF]" />
              Encaissé (FCFA)
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={encaissementsParMois}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 12, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v: number) => formatFCFACompact(v)}
                />
                <Tooltip
                  content={<EncaissementsTooltip />}
                  cursor={{ fill: barCursorFill, fillOpacity: 0.7 }}
                />
                <Bar dataKey="valeur" fill={SLTT_BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        )}

        {hasSection("chart_marges") && (
        <Card className="p-5 shadow-sm border-border/80 rounded-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Écarts par période
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Marge brute mensuelle</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-full bg-[#059669]" />
                Bénéfice
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-full bg-[#DC2626]" />
                Perte
              </span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ecartsParPeriode}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="periode"
                  tick={{ fontSize: 12, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v: number) => formatFCFACompact(v)}
                />
                <Tooltip
                  content={<EcartsTooltip />}
                  cursor={{ stroke: lineCursorStroke, strokeWidth: 1 }}
                />
                <ReferenceLine y={0} stroke={lineCursorStroke} strokeDasharray="4 3" />
                <Line
                  type="monotone"
                  dataKey="ecart"
                  stroke={SLTT_BLUE}
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { ecart: number } };
                    return (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.ecart >= 0 ? SLTT_EMERALD : SLTT_RED}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        )}
      </div>
      )}

      {/* 4. BLOCKS ROW */}
      {showBlocksRow && (
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

        {hasSection("derniers_dossiers") && (
        <Card className={cn(
          "gap-0 overflow-hidden p-0 shadow-sm border-border/80 rounded-xl",
          (hasSection("chart_statuts") || hasSection("alertes_stock") || hasSection("alertes_dossiers"))
            ? "lg:col-span-2"
            : "lg:col-span-3",
        )}>

          {/* Header — même rythme que les cards de graphiques ci-dessus (px-5, titre text-sm) */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-slate-400 dark:text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Derniers dossiers</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {derniersDossiers.length}
              </span>
            </div>
            <button
              onClick={() => go("dossiers")}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Voir tout <ArrowRight className="size-3.5" />
            </button>
          </div>

          {/* Labels colonnes */}
          <div className="grid grid-cols-[1fr_1.5fr_auto_auto] gap-x-3 border-b border-border/60 bg-slate-50/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <span>Référence</span>
            <span>Client</span>
            <span>Statut</span>
            <span className="text-right">Montant</span>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-border/60">
            {derniersDossiers.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Aucun dossier enregistré.</div>
            ) : (
              derniersDossiers.map((d) => {
                const dotColor = DOSSIER_STATUT_DOT[d.statut];
                return (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    className="grid cursor-pointer grid-cols-[1fr_1.5fr_auto_auto] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => go("dossier-detail", { id: d.id })}
                    onKeyDown={(e) => e.key === "Enter" && go("dossier-detail", { id: d.id })}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${dotColor}`} />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200">
                          {d.reference.replace("SLTT-TR-", "")}
                        </p>
                        <p className="text-[11px] leading-tight text-slate-400 dark:text-slate-500">{d.bl}</p>
                      </div>
                    </div>
                    <p className="truncate text-sm text-slate-600 dark:text-slate-300">{d.clientNom}</p>
                    <DossierStatutBadge statut={d.statut} />
                    <p className="text-right font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatFCFACompact(d.montantInvesti)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
        )}

        {(hasSection("chart_statuts") || hasSection("alertes_stock") || hasSection("alertes_dossiers")) && (
        <div className={cn(
          "flex flex-col gap-6",
          hasSection("derniers_dossiers") ? "lg:col-span-1" : "lg:col-span-3",
        )}>

          {hasSection("chart_statuts") && (
          <Card className="gap-0 p-0 shadow-sm border-border/80 rounded-xl">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <PieChartIcon className="size-4 text-slate-400 dark:text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Par statut</h2>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {totalDossiers} dossier{totalDossiers > 1 ? "s" : ""}
              </span>
            </div>

            {totalDossiers === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FolderKanban className="size-7 text-slate-200 dark:text-slate-700" />
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Aucun dossier</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="relative h-24 w-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statutDonutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={30}
                        outerRadius={46}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {statutDonutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold tabular-nums leading-none text-slate-900 dark:text-slate-100">{totalDossiers}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">total</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2.5">
                  {statutDonutData.map((entry) => {
                    const pct = Math.round((entry.value / totalDossiers) * 100);
                    return (
                      <div key={entry.name}>
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                          <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{entry.name}</span>
                          <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">{entry.value}</span>
                          <span className="w-7 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: entry.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
          )}

          {(hasSection("alertes_stock") || hasSection("alertes_dossiers")) && (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80 rounded-xl">
            <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3.5">
              <AlertTriangle className="size-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Alertes</h2>
              {filteredAlertes.length > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-none text-white">
                  {filteredAlertes.length}
                </span>
              )}
            </div>

            <div className="max-h-64 divide-y divide-border/60 overflow-y-auto">
              {filteredAlertes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="size-7 text-emerald-300" />
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Aucune alerte</p>
                </div>
              ) : (
                filteredAlertes.map((alert) => {
                  const isDanger = alert.niveau === "danger";
                  const AlertIcon = isDanger ? AlertTriangle : AlertCircle;
                  return (
                    <div
                      key={alert.id}
                      role="button"
                      tabIndex={0}
                      className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onClick={() => go(alert.target.view, alert.target.id ? { id: alert.target.id } : undefined)}
                      onKeyDown={(e) => e.key === "Enter" && go(alert.target.view, alert.target.id ? { id: alert.target.id } : undefined)}
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          isDanger ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        }`}
                      >
                        <AlertIcon className="size-4" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="truncate text-xs font-semibold leading-snug text-slate-800 dark:text-slate-200">
                          {alert.message}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-400 dark:text-slate-500">
                          {alert.detail}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
          )}

        </div>
        )}
      </div>
      )}
    </div>
  );
}

export default DashboardScreen;
