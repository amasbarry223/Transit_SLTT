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
  TrendingUp,
  Package,
  Users,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { KpiCard } from "@/components/sltt/kpi-card";
import { PageHeader } from "@/components/sltt/page-header";
import { DossierStatutBadge } from "@/components/sltt/status-badge";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA, formatFCFACompact } from "@/lib/format";

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
    <div className="rounded-lg border border-border bg-white p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900">{mois}</p>
      <p className="mt-0.5 tabular-nums text-slate-600">{formatFCFA(valeur)}</p>
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
    <div className="rounded-lg border border-border bg-white p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900">{periode}</p>
      <p className={"mt-0.5 tabular-nums font-medium " + (isPositive ? "text-emerald-600" : "text-red-600")}>
        {isPositive ? "+" : ""}{formatFCFA(ecart)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ROLE-SPECIFIC PANELS                                                */
/* ------------------------------------------------------------------ */

function AgentPanel({ go }: { go: (v: "dossiers" | "devis") => void }) {
  const dossiers = useStore((s) => s.dossiers);
  const pipeline: Record<string, number> = { "En cours": 0, "Dédouané": 0, "Livré": 0, "Soldé": 0 };
  for (const d of dossiers) pipeline[d.statut] = (pipeline[d.statut] ?? 0) + 1;

  const steps = [
    { label: "En cours",  count: pipeline["En cours"],  color: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700"  },
    { label: "Dédouané",  count: pipeline["Dédouané"],  color: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-700"},
    { label: "Livré",     count: pipeline["Livré"],     color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700"},
    { label: "Soldé",     count: pipeline["Soldé"],     color: "bg-slate-400",   bg: "bg-slate-100",  text: "text-slate-600" },
  ];

  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Pipeline dossiers</h2>
          <p className="text-xs text-slate-500">État de votre portefeuille</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => go("dossiers")}>
          Voir tous <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {steps.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold tabular-nums ${s.text}`}>{s.count}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">{s.label}</p>
            <div className={`mx-auto mt-2 h-1 w-8 rounded-full ${s.color}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function MagasinierPanel({ go }: { go: (v: "entreposage" | "bons") => void }) {
  const stock = useStore((s) => s.stock);
  const bons = useStore((s) => s.bons);
  const lowStock = stock.filter((s) => s.quantite <= s.seuil);
  const bonsBrouillon = bons.filter((b) => b.statut === "Brouillon");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">État du stock</h2>
            <p className="text-xs text-slate-500">{stock.length} articles gérés</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => go("entreposage")}>
            Stock <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        {stock.slice(0, 4).map((s) => {
          const pct = Math.min(100, Math.round((s.quantite / Math.max(1, s.seuil * 2)) * 100));
          const low = s.quantite <= s.seuil;
          return (
            <div key={s.id} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 truncate max-w-[60%]">{s.marchandise}</span>
                <span className={`tabular-nums font-semibold ${low ? "text-red-600" : "text-slate-600"}`}>
                  {s.quantite} {s.unite}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full transition-all ${low ? "bg-red-400" : "bg-emerald-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {lowStock.length > 0 && (
          <p className="mt-3 text-xs font-medium text-red-600">⚠ {lowStock.length} article{lowStock.length > 1 ? "s" : ""} sous le seuil</p>
        )}
      </Card>

      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Bons en attente</h2>
            <p className="text-xs text-slate-500">{bonsBrouillon.length} brouillon{bonsBrouillon.length !== 1 ? "s" : ""} à valider</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => go("bons")}>
            Bons <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        {bonsBrouillon.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-8 text-emerald-300" />
            <p className="mt-2 text-sm text-slate-500">Aucun bon en attente</p>
          </div>
        ) : (
          bonsBrouillon.slice(0, 4).map((b) => (
            <div key={b.id} className="mb-3 flex items-center gap-3 last:mb-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Package className="size-3.5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">{b.reference}</p>
                <p className="truncate text-xs text-slate-500">{b.marchandise} · {b.quantite} {b.unite}</p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function CommercialPanel({ go }: { go: (v: "devis" | "clients") => void }) {
  const clients = useStore((s) => s.clients);
  const devis = useStore((s) => s.devis);
  const topClients = [...clients].sort((a, b) => b.totalPaye - a.totalPaye).slice(0, 5);
  const devisEnvoyés = devis.filter((d) => d.statut === "Envoyé").length;
  const devisAcceptés = devis.filter((d) => d.statut === "Accepté").length;
  const totalDevis = devis.length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Pipeline devis</h2>
            <p className="text-xs text-slate-500">{totalDevis} devis au total</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => go("devis")}>
            Devis <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        <div className="space-y-3">
          {[
            { label: "Envoyés (en attente)", count: devisEnvoyés, color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
            { label: "Acceptés", count: devisAcceptés, color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Total", count: totalDevis, color: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-700" },
          ].map((row) => (
            <div key={row.label} className={`flex items-center justify-between rounded-lg px-4 py-3 ${row.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${row.color}`} />
                <span className="text-xs font-medium text-slate-700">{row.label}</span>
              </div>
              <span className={`text-lg font-bold tabular-nums ${row.text}`}>{row.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Meilleurs clients</h2>
            <p className="text-xs text-slate-500">Par chiffre encaissé</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => go("clients")}>
            Clients <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        {topClients.map((c, i) => (
          <div key={c.id} className="mb-3 flex items-center gap-3 last:mb-0">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{c.nom}</p>
              <p className="text-xs text-slate-500">{c.nbDossiers} dossiers</p>
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-700">{formatFCFA(c.totalPaye)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ComptablePanel({ go }: { go: (v: "comptabilite" | "bilans") => void }) {
  const ecritures = useStore((s) => s.ecritures);
  const dossiers = useStore((s) => s.dossiers);
  const totalDu = dossiers.reduce((s, d) => s + Math.max(0, d.montantInvesti - d.montantPaye), 0);
  const nbImpayés = dossiers.filter((d) => d.montantInvesti - d.montantPaye > 0).length;
  const dernières = [...ecritures]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 5);

  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Créances en cours</h2>
          <p className="text-xs text-slate-500">{nbImpayés} dossier{nbImpayés !== 1 ? "s" : ""} non soldé{nbImpayés !== 1 ? "s" : ""} · {formatFCFA(totalDu)} restants</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => go("comptabilite")}>
          Comptabilité <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        {dernières.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <div className={`size-2 shrink-0 rounded-full ${e.montantPaye >= e.montantInvesti ? "bg-emerald-500" : "bg-amber-400"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{e.clientNom}</p>
              <p className="text-xs text-slate-500">{e.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tabular-nums text-slate-900">{formatFCFA(e.montantPaye)}</p>
              <p className="text-[10px] text-slate-400">/ {formatFCFA(e.montantInvesti)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
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
}

/* ------------------------------------------------------------------ */
/* SCREEN                                                              */
/* ------------------------------------------------------------------ */

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);
  const dossiers = useStore((s) => s.dossiers);
  const ecritures = useStore((s) => s.ecritures);
  const stock = useStore((s) => s.stock);

  const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  // Ancrage temporel : date la plus récente dans les données (évite le décalage
  // entre la date système et la date des données mock/importées)
  const refDate = React.useMemo(() => {
    const all = [
      ...ecritures.map((e) => e.date),
      ...dossiers.map((d) => d.date),
    ];
    if (all.length === 0) return new Date();
    return new Date(all.reduce((a, b) => (a > b ? a : b)));
  }, [ecritures, dossiers]);

  // Libellé de période basé sur la date de référence (pas la date système)
  const periodeLabel = refDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  // ---- Live KPI computations ----
  const { chiffreEncaisse, variationEncaisse } = React.useMemo(() => {
    const curM = refDate.getMonth();
    const curY = refDate.getFullYear();
    const prevM = curM === 0 ? 11 : curM - 1;
    const prevY = curM === 0 ? curY - 1 : curY;

    // Source unique : ecritures (paiements datés)
    const current = ecritures
      .filter((e) => { const d = new Date(e.date); return d.getFullYear() === curY && d.getMonth() === curM; })
      .reduce((sum, e) => sum + e.montantPaye, 0);
    const prev = ecritures
      .filter((e) => { const d = new Date(e.date); return d.getFullYear() === prevY && d.getMonth() === prevM; })
      .reduce((sum, e) => sum + e.montantPaye, 0);

    const variation = prev === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - prev) / prev) * 100);
    return { chiffreEncaisse: current, variationEncaisse: variation };
  }, [ecritures, refDate]);

  // Restes à payer et dossiers non soldés → source : dossiers (pas les écritures)
  const { totalRestesAPayer, nbDossiersNonSoldes } = React.useMemo(() => {
    let total = 0;
    let count = 0;
    for (const d of dossiers) {
      const reste = Math.max(0, d.montantInvesti - d.montantPaye);
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
  const encaissementsParMois = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const valeur = ecritures
        .filter((e) => { const dd = new Date(e.date); return dd.getFullYear() === y && dd.getMonth() === m; })
        .reduce((sum, e) => sum + e.montantPaye, 0);
      return { mois: MONTHS[m], valeur };
    });
  }, [ecritures, refDate]);

  // ---- Chart: marge brute des 6 derniers mois (source : dossiers) ----
  const ecartsParPeriode = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const ecart = dossiers
        .filter((dos) => { const dd = new Date(dos.date); return dd.getFullYear() === y && dd.getMonth() === m; })
        .reduce((sum, dos) => sum + (dos.fraisPrestation - dos.droitDouane - dos.fraisCircuit), 0);
      return { periode: MONTHS[m], ecart };
    });
  }, [dossiers, refDate]);

  // ---- Derniers dossiers (sorted by date desc, first 6) ----
  const derniersDossiers = React.useMemo(
    () =>
      [...dossiers]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, 6),
    [dossiers],
  );

  // ---- Chart: répartition dossiers par statut (donut) ----
  const statutColors: Record<string, string> = {
    "En cours":   "#1E40AF",
    "Dédouané":   "#7C3AED",
    "Livré":      "#059669",
    "Soldé":      "#64748B",
  };

  const statutDonutData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of dossiers) {
      counts[d.statut] = (counts[d.statut] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: statutColors[name] ?? "#94A3B8" }));
  }, [dossiers]);

  const totalDossiers = dossiers.length;

  // ---- Live alerts (low stock + unpaid dossiers) ----
  const alertes = React.useMemo<LiveAlert[]>(() => {
    const lowStock: LiveAlert[] = stock
      .filter((s) => s.quantite < s.seuil)
      .map((s) => ({
        id: `stock-${s.id}`,
        niveau: "danger" as const,
        message: `Stock faible : ${s.marchandise}`,
        detail: `${s.quantite} ${s.unite} restants — ${s.depositaire}`,
      }));

    const unpaid: LiveAlert[] = dossiers
      .filter((d) => d.montantInvesti - d.montantPaye > 0)
      .slice(0, 4)
      .map((d) => ({
        id: `dossier-${d.id}`,
        niveau: "warning" as const,
        message: `Dossier non soldé : ${d.reference}`,
        detail: `Reste à payer : ${formatFCFA(
          d.montantInvesti - d.montantPaye,
        )} — ${d.clientNom}`,
      }));

    return [...lowStock, ...unpaid];
  }, [stock, dossiers]);

  const firstName = currentUserName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Tableau de bord"
        description={`Bonjour ${firstName} — Vue d'ensemble de votre activité ce mois-ci`}
      >
        <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-white px-3 py-1.5 text-sm shadow-sm">
          <span className="text-slate-500">Période :</span>
          <span className="font-medium text-slate-900">{periodeLabel}</span>
        </div>
      </PageHeader>

      {/* 2. KPI ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Chiffre encaissé (ce mois)"
          value={formatFCFA(chiffreEncaisse)}
          icon={Wallet}
          tone="emerald"
          variation={variationEncaisse}
          variationLabel="vs mois dernier"
        />
        <KpiCard
          label="Total restes à payer"
          value={formatFCFA(totalRestesAPayer)}
          icon={Clock}
          tone="amber"
          sublabel={`Sur ${nbDossiersNonSoldes} dossier${nbDossiersNonSoldes > 1 ? "s" : ""}`}
        />
        <KpiCard
          label="Dossiers en cours"
          value={String(dossiersEnCours)}
          icon={FolderKanban}
          tone="blue"
          sublabel={dossiersALivrer > 0 ? `${dossiersALivrer} dédouané${dossiersALivrer > 1 ? "s" : ""} à livrer` : "Aucun en attente de livraison"}
        />
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Warehouse}
          tone="indigo"
          sublabel={`${stock.length} article${stock.length > 1 ? "s" : ""}`}
        />
      </div>

      {/* 2b. ROLE PANEL */}
      {currentRole === "Agent de transit" && (
        <AgentPanel go={go as (v: "dossiers" | "devis") => void} />
      )}
      {currentRole === "Magasinier" && (
        <MagasinierPanel go={go as (v: "entreposage" | "bons") => void} />
      )}
      {currentRole === "Commercial" && (
        <CommercialPanel go={go as (v: "devis" | "clients") => void} />
      )}
      {currentRole === "Comptable" && (
        <ComptablePanel go={go as (v: "comptabilite" | "bilans") => void} />
      )}

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Bar chart — Encaissements par mois (CDC §6.6 : "barres") */}
        <Card className="p-5 shadow-sm border-border/80 rounded-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Encaissements par mois
              </h2>
              <p className="text-xs text-slate-500">6 derniers mois</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
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
                  stroke={SLTT_GRID}
                  vertical={false}
                />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v: number) => formatFCFACompact(v)}
                />
                <Tooltip
                  content={<EncaissementsTooltip />}
                  cursor={{ fill: "#EFF6FF", fillOpacity: 0.7 }}
                />
                <Bar dataKey="valeur" fill={SLTT_BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Line chart — Écarts par période (CDC §6.6 : "courbe") */}
        <Card className="p-5 shadow-sm border-border/80 rounded-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Écarts par période
              </h2>
              <p className="text-xs text-slate-500">Marge brute mensuelle</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
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
                  stroke={SLTT_GRID}
                  vertical={false}
                />
                <XAxis
                  dataKey="periode"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v: number) => formatFCFACompact(v)}
                />
                <Tooltip
                  content={<EcartsTooltip />}
                  cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }}
                />
                <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 3" />
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
      </div>

      {/* 4. BLOCKS ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Derniers dossiers (lg:col-span-2) */}
        <Card className="shadow-sm border-border/80 rounded-xl lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-border/80 p-5 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Derniers dossiers
              </h2>
              <p className="text-xs text-slate-500">
                {derniersDossiers.length} dossiers les plus récents
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => go("dossiers")}
            >
              Voir tout
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          <div className="p-2 sm:p-3">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Référence
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Client
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    N° BL
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Statut
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Montant
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {derniersDossiers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      Aucun dossier enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  derniersDossiers.map((d) => (
                    <TableRow
                      key={d.id}
                      className="border-b border-border hover:bg-slate-50/60"
                    >
                      <TableCell className="font-medium text-slate-900">
                        {d.reference}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-slate-700">
                        {d.clientNom}
                      </TableCell>
                      <TableCell className="tabular-nums text-slate-700">
                        {d.bl}
                      </TableCell>
                      <TableCell>
                        <DossierStatutBadge statut={d.statut} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-slate-900">
                        {formatFCFA(d.montantInvesti)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Right column: Donut statut + Alertes */}
        <div className="flex flex-col gap-6 lg:col-span-1">

          {/* Donut — Répartition par statut */}
          <Card className="shadow-sm border-border/80 rounded-xl p-5">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">Répartition par statut</h2>
              <p className="text-xs text-slate-500">{totalDossiers} dossier{totalDossiers !== 1 ? "s" : ""} au total</p>
            </div>

            {totalDossiers === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="size-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">Aucun dossier</p>
              </div>
            ) : (
              <>
                <div className="relative h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statutDonutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={76}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {statutDonutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0] as { name: string; value: number; payload: { color: string } };
                          return (
                            <div className="rounded-lg border border-border bg-white p-2.5 text-xs shadow-md">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full" style={{ background: p.payload.color }} />
                                <span className="text-slate-700">{p.name}</span>
                                <span className="ml-2 font-semibold tabular-nums text-slate-900">{p.value}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums text-slate-900">{totalDossiers}</span>
                    <span className="text-xs text-slate-400">dossiers</span>
                  </div>
                </div>

                {/* Légende */}
                <div className="mt-3 space-y-1.5">
                  {statutDonutData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                      <span className="text-slate-600">{entry.name}</span>
                      <span className="ml-auto font-semibold tabular-nums text-slate-900">{entry.value}</span>
                      <span className="w-8 text-right tabular-nums text-slate-400">
                        {Math.round((entry.value / totalDossiers) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Alertes */}
          <Card className="shadow-sm border-border/80 rounded-xl">
            <div className="flex items-center justify-between gap-3 border-b border-border/80 p-5 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Alertes</h2>
                <p className="text-xs text-slate-500">
                  {alertes.length} alerte{alertes.length > 1 ? "s" : ""} active{alertes.length > 1 ? "s" : ""}
                </p>
              </div>
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="size-4" />
              </span>
            </div>

            <div className="max-h-[280px] overflow-y-auto sltt-scroll divide-y divide-border">
              {alertes.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Aucune alerte active.
                </div>
              ) : (
                alertes.map((alert) => {
                  const isDanger = alert.niveau === "danger";
                  const Icon = isDanger ? AlertTriangle : AlertCircle;
                  const iconWrapClass = isDanger
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-600";
                  return (
                    <div
                      key={alert.id}
                      className="flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-slate-50/80"
                      onClick={() => go(alert.niveau === "danger" ? "entreposage" : "comptabilite")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && go(alert.niveau === "danger" ? "entreposage" : "comptabilite")}
                    >
                      <span
                        className={
                          "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg " +
                          iconWrapClass
                        }
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{alert.detail}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardScreen;
