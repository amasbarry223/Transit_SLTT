"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Wallet,
  Clock,
  FolderKanban,
  Warehouse,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
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
import { encaissementsParMois, ecartsParPeriode } from "@/lib/mock-data";

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

type AreaTooltipPayload = {
  name?: string | number;
  value?: number;
  payload?: { mois: string; valeur: number };
};

function EncaissementsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: AreaTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const valeur = item?.value ?? 0;
  return (
    <div className="rounded-lg border border-border bg-white p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900">
        {item?.payload?.mois ?? ""}
      </p>
      <p className="mt-0.5 tabular-nums text-slate-600">
        {formatFCFA(valeur)}
      </p>
    </div>
  );
}

type BarTooltipPayload = {
  name?: string | number;
  value?: number;
  payload?: { periode: string; ecart: number };
};

function EcartsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: BarTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const ecart = item?.value ?? 0;
  const isPositive = ecart >= 0;
  return (
    <div className="rounded-lg border border-border bg-white p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900">
        {item?.payload?.periode ?? ""}
      </p>
      <p
        className={
          "mt-0.5 tabular-nums font-medium " +
          (isPositive ? "text-emerald-600" : "text-red-600")
        }
      >
        {isPositive ? "+" : ""}
        {formatFCFA(ecart)}
      </p>
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
}

/* ------------------------------------------------------------------ */
/* SCREEN                                                              */
/* ------------------------------------------------------------------ */

export function DashboardScreen() {
  const go = useNav((s) => s.go);
  const dossiers = useStore((s) => s.dossiers);
  const ecritures = useStore((s) => s.ecritures);
  const stock = useStore((s) => s.stock);

  // ---- Live KPI computations ----
  const chiffreEncaisse = React.useMemo(
    () => ecritures.reduce((sum, e) => sum + e.montantPaye, 0),
    [ecritures],
  );

  const { totalRestesAPayer, nbDossiersNonSoldes } = React.useMemo(() => {
    let total = 0;
    let count = 0;
    for (const e of ecritures) {
      const reste = Math.max(0, e.montantInvesti - e.montantPaye);
      if (reste > 0) {
        total += reste;
        count += 1;
      }
    }
    return { totalRestesAPayer: total, nbDossiersNonSoldes: count };
  }, [ecritures]);

  const dossiersEnCours = React.useMemo(
    () => dossiers.filter((d) => d.statut === "En cours").length,
    [dossiers],
  );

  const valeurStock = React.useMemo(
    () => stock.reduce((sum, s) => sum + s.sommePayee + s.resteAPayer, 0),
    [stock],
  );

  // ---- Derniers dossiers (sorted by date desc, first 6) ----
  const derniersDossiers = React.useMemo(
    () =>
      [...dossiers]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, 6),
    [dossiers],
  );

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

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité ce mois-ci"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-white px-3 py-1.5 text-sm shadow-sm">
          <span className="text-slate-500">Période :</span>
          <span className="font-medium text-slate-900">Janvier 2026</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Actualiser"
          title="Actualiser"
        >
          <RefreshCw className="size-4" />
        </Button>
      </PageHeader>

      {/* 2. KPI ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Chiffre encaissé (ce mois)"
          value={formatFCFA(chiffreEncaisse)}
          icon={Wallet}
          tone="emerald"
          variation={12}
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
          sublabel="6 à dédouaner"
        />
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Warehouse}
          tone="indigo"
          sublabel={`${stock.length} article${stock.length > 1 ? "s" : ""}`}
        />
      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Area chart — Encaissements par mois */}
        <Card className="p-5 shadow-sm border-border/80 rounded-xl">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Encaissements par mois
            </h2>
            <p className="text-xs text-slate-500">6 derniers mois</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={encaissementsParMois}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="encaissementsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SLTT_BLUE} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={SLTT_BLUE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
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
                  cursor={{ stroke: SLTT_BLUE, strokeWidth: 1, strokeOpacity: 0.4 }}
                />
                <Area
                  type="monotone"
                  dataKey="valeur"
                  stroke={SLTT_BLUE}
                  strokeWidth={2.5}
                  fill="url(#encaissementsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Bar chart — Écarts par période */}
        <Card className="p-5 shadow-sm border-border/80 rounded-xl">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Écarts par période
            </h2>
            <p className="text-xs text-slate-500">
              Vert : bénéfice · Rouge : perte
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
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
                  cursor={{ fill: "#F1F5F9", fillOpacity: 0.6 }}
                />
                <Bar dataKey="ecart" radius={[4, 4, 0, 0]}>
                  {ecartsParPeriode.map((entry) => (
                    <Cell
                      key={entry.periode}
                      fill={entry.ecart >= 0 ? SLTT_EMERALD : SLTT_RED}
                    />
                  ))}
                </Bar>
              </BarChart>
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

        {/* Right: Alertes (lg:col-span-1) */}
        <Card className="shadow-sm border-border/80 rounded-xl lg:col-span-1">
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

          <div className="max-h-[360px] overflow-y-auto sltt-scroll divide-y divide-border">
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
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-slate-50/60"
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
                      <p className="text-sm font-medium text-slate-900">
                        {alert.message}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {alert.detail}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardScreen;
