"use client";

import { useMemo, useState } from "react";
import {
  Wallet,
  Clock,
  TrendingUp,
  Scale,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import {
  recapParClient,
  evolutionEncaissements,
} from "@/lib/mock-data";
import { formatFCFA, formatFCFACompact } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EcartValue } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const BLUE = "#1E40AF";
const EMERALD = "#059669";
const AMBER = "#D97706";

interface LinePayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function LineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: LinePayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-md">
      <p className="mb-1.5 font-semibold text-slate-900">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div
            key={p.dataKey}
            className="flex items-center gap-2 text-slate-600"
          >
            <span
              className="size-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="capitalize">{p.dataKey}</span>
            <span className="ml-auto font-medium tabular-nums text-slate-900">
              {formatFCFA(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PiePayload {
  name: string;
  value: number;
  payload: { name: string; value: number; color: string };
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PiePayload[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ background: p.payload.color }}
        />
        <span className="text-slate-600">{p.name}</span>
        <span className="ml-auto font-medium tabular-nums text-slate-900">
          {formatFCFA(p.value)}
        </span>
      </div>
    </div>
  );
}

const periodes = [
  { value: "mensuel", label: "Mensuel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "semestriel", label: "Semestriel" },
  { value: "annuel", label: "Annuel" },
];

export function BilansScreen() {
  const [periode, setPeriode] = useState("mensuel");
  const [mois, setMois] = useState("2026-01");

  const totalInvesti = useMemo(
    () => evolutionEncaissements.reduce((s, e) => s + e.investi, 0),
    [],
  );
  const totalEncaisse = useMemo(
    () => evolutionEncaissements.reduce((s, e) => s + e.encaisse, 0),
    [],
  );
  const totalDu = totalInvesti - totalEncaisse;
  const ecartGlobal = totalEncaisse - totalInvesti;

  const recapTotaux = useMemo(
    () =>
      recapParClient.reduce(
        (acc, r) => {
          acc.investi += r.investi;
          acc.encaisse += r.encaisse;
          acc.reste += r.reste;
          acc.ecart += r.ecart;
          return acc;
        },
        { investi: 0, encaisse: 0, reste: 0, ecart: 0 },
      ),
    [],
  );

  const pieData = [
    { name: "Encaissé", value: recapTotaux.encaisse, color: EMERALD },
    { name: "Restes à payer", value: recapTotaux.reste, color: AMBER },
  ];
  const pieTotal = recapTotaux.encaisse + recapTotaux.reste;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bilans périodiques"
        description="Analyse financière par période"
      >
        <Button variant="outline">
          <FileText className="size-4" />
          Exporter PDF
        </Button>
        <Button variant="outline">
          <FileSpreadsheet className="size-4" />
          Exporter Excel
        </Button>
      </PageHeader>

      {/* Period selector */}
      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={periode} onValueChange={setPeriode}>
            <TabsList>
              {periodes.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Période :</span>
            <Input
              type="month"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="w-44"
            />
          </div>
        </div>
      </Card>

      {/* Synthesis banner */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total investi"
          value={formatFCFA(totalInvesti)}
          icon={TrendingUp}
          tone="blue"
        />
        <KpiCard
          label="Total encaissé"
          value={formatFCFA(totalEncaisse)}
          icon={Wallet}
          tone="emerald"
        />
        <KpiCard
          label="Total dû"
          value={formatFCFA(totalDu)}
          icon={Clock}
          tone="amber"
        />
        <KpiCard
          label="Écart global"
          value={formatFCFA(ecartGlobal)}
          icon={Scale}
          tone="indigo"
        />
      </div>

      {/* Main chart */}
      <Card className="p-5 shadow-sm border-border/80 gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Évolution des encaissements
          </h2>
          <p className="text-sm text-slate-500">
            Comparaison investi vs encaissé par période
          </p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={evolutionEncaissements}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="periode"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatFCFACompact(Number(v))}
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<LineTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="investi"
                name="Investi"
                stroke={BLUE}
                strokeWidth={2.5}
                dot={{ r: 3, fill: BLUE, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="encaisse"
                name="Encaissé"
                stroke={EMERALD}
                strokeWidth={2.5}
                dot={{ r: 3, fill: EMERALD, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recap table + Pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 shadow-sm border-border/80 lg:col-span-2 gap-4">
          <h2 className="text-base font-semibold text-slate-900">
            Récapitulatif par client
          </h2>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  Client
                </TableHead>
                <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                  Investi
                </TableHead>
                <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                  Encaissé
                </TableHead>
                <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                  Reste à payer
                </TableHead>
                <TableHead className="bg-slate-50 text-right text-xs font-medium uppercase text-slate-500">
                  Écart
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recapParClient.map((r) => (
                <TableRow
                  key={r.client}
                  className="border-b border-border hover:bg-slate-50/60"
                >
                  <TableCell className="font-medium text-slate-700">
                    {r.client}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700">
                    {formatFCFA(r.investi)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {formatFCFA(r.encaisse)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-amber-600">
                    {formatFCFA(r.reste)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EcartValue value={r.ecart} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="border-0 bg-slate-50 hover:bg-slate-50">
                <TableCell className="font-bold text-slate-900">Total</TableCell>
                <TableCell className="text-right font-bold tabular-nums text-slate-900">
                  {formatFCFA(recapTotaux.investi)}
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums text-slate-900">
                  {formatFCFA(recapTotaux.encaisse)}
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums text-slate-900">
                  {formatFCFA(recapTotaux.reste)}
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums text-slate-900">
                  {formatFCFA(recapTotaux.ecart)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>

        <Card className="p-5 shadow-sm border-border/80 lg:col-span-1 gap-4">
          <h2 className="text-base font-semibold text-slate-900">
            Répartition
          </h2>
          <div className="relative h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500">Total</span>
              <span className="text-sm font-bold tabular-nums text-slate-900">
                {formatFCFA(pieTotal)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {pieData.map((d) => {
              const pct =
                pieTotal > 0 ? (d.value / pieTotal) * 100 : 0;
              return (
                <div
                  key={d.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="ml-auto font-medium tabular-nums text-slate-900">
                    {formatFCFA(d.value)}
                  </span>
                  <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
